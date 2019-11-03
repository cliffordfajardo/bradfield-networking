#!/usr/bin/env python3
"""
A script for parsing the pcapture of a mystery image download.

Usage: ./packet-buffer-solution.py -o out.jpg path/to/net.cap

For extensive informational logging, use -v or --verbose flag
"""

import argparse
from collections import namedtuple
from datetime import datetime
import struct
import sys


file_header_fields = ['magic_number', 'major_version', 'minor_version',
                      'tz_offset', 'tz_accuracy', 'snapshot_length',
                      'link_type']


class FileHeader(namedtuple('FileHeader', file_header_fields)):
    """
    The header of the entire pcap savefile

    See https://www.tcpdump.org/manpages/pcap-savefile.5.txt for specifications
    """
    __slots__ = ()
    LENGTH = 24

    def __new__(cls, bs):
        return super().__new__(cls, *struct.unpack('IHHIIII', bs))

    def __str__(self):
        return "pcap savefile version {}.{}".format(
                self.major_version, self.minor_version)

    def verify(self):
        assert self.magic_number == 0xa1b2c3d4
        assert self.major_version == 2
        assert self.minor_version == 4
        assert self.tz_offset == 0
        assert self.tz_accuracy == 0
        assert self.link_type == 1  # LINKTYPE_ETHERNET


pcap_packet_header_fields = ['ts_seconds', 'ts_micro_nano', 'payload_length',
                             'untruncated_length']


class PcapPacketHeader(namedtuple('PcapPacketHeader',
                                  pcap_packet_header_fields)):
    """
    The header for an individually captured libpcap header

    See the bottom of https://www.tcpdump.org/manpages/pcap-savefile.5.txt
    for specifications
    """
    __slots__ = ()
    LENGTH = 16

    def __new__(cls, bs):
        return super().__new__(cls, *struct.unpack('IIII', bs))

    def __str__(self):
        return "pcap packet length {}B, captured at {}".format(
            self.payload_length, datetime.fromtimestamp(
                self.ts_seconds + 1e-6 * self.ts_micro_nano))

    def verify(self):
        """ensure that the entire packet was captured"""
        assert self.payload_length == self.untruncated_length


ethernet_header_fields = ['destination_mac', 'source_mac', 'ether_type']


class EthernetFrameHeader(namedtuple('EthernetFrameHeader',
                                     ethernet_header_fields)):
    """
    The header of an ethernet frame, at the link layer (prelude, SFD omitted)

    See https://en.wikipedia.org/wiki/Ethernet_frame for specification
    """
    __slots__ = ()
    LENGTH = 14

    def __new__(cls, bs):
        return super().__new__(cls, bs[0:6], bs[6:12], bs[12:14])

    def __str__(self):
        def fmt_mac(bs):
            return ':'.join('{:02x}'.format(b) for b in bs)
        return "Ethernet frame from {} to {}".format(
            fmt_mac(self.source_mac), fmt_mac(self.destination_mac))

    def verify(self):
        # Verify ethertype for an IPv4 datagram
        assert self.ether_type == bytes.fromhex('0800')


ip_datagram_header_fields = [
    'version', 'ihl', 'dscp', 'ecn', 'total_length', 'identification', 'flags',
    'fragment_offset', 'ttl', 'protocol', 'checksum', 'source_ip',
    'destination_ip'
]


class IpDatagramHeader(namedtuple('IpDatagramHeader',
                                  ip_datagram_header_fields)):
    """
    The header of an IPv4 datagram

    See https://en.wikipedia.org/wiki/IPv4#Packet_structure for specification
    """
    __slots__ = ()

    def __new__(cls, bs):
        b1, b2, total_length, identification, b7_8, ttl, protocol, checksum = \
            struct.unpack('BBHHHBBH', bs[:12])
        version = b1 >> 4
        ihl = cls.get_ihl(b1)
        dscp = b2 >> 2
        ecn = b2 & 3
        flags = b7_8 >> 13
        fragment_offset = b7_8 & 0x1fff
        source_ip = bs[12:16]
        destination_ip = bs[16:20]
        return super().__new__(
            cls, version, ihl, dscp, ecn, total_length, identification, flags,
            fragment_offset, ttl, protocol, checksum, source_ip,
            destination_ip)

    def __str__(self):
        def fmt_ip(bs):
            return '.'.join('{:d}'.format(b) for b in bs)
        return 'IPv4 datagram from {} to {}'.format(
                fmt_ip(self.source_ip), fmt_ip(self.destination_ip))

    @staticmethod
    def get_ihl(b):
        """
        Given the first byte of the header, Internet Header Length, which
        represents the number of 32 bit _words_ in the header
        """
        return b & 0x0f

    @staticmethod
    def verify_checksum(bs):
        """
        The 16 bit one's complement of the one's complement sum of all 16 bit
        values in the header should be 0
        """
        total = sum(t[0] for t in struct.iter_unpack('H', bs))
        carry_wrapped = (total & 0xffff) + (total >> 16)
        assert carry_wrapped == 0xffff

    def verify(self):
        assert self.version == 4
        assert self.ecn == 0
        assert self.protocol == 6  # indicates TCP


tcp_header_fields = ['source_port', 'destination_port', 'seq_number',
                     'ack_number', 'data_offset', 'reserved_bits', 'flags',
                     'window_size', 'checksum', 'urgent_pointer']


class TcpHeader(namedtuple('TcpHeader', tcp_header_fields)):
    """
    A TCP segment header

    See https://en.wikipedia.org/wiki/Transmission_Control_Protocol#TCP_segment_structure
    """
    __slots__ = ()
    DEFAULT_LENGTH = 20

    def __new__(cls, bs):
        source_port, destination_port, seq_number, ack_number, b12_13, \
            window_size, checksum, urgent_pointer \
            = struct.unpack('!HHIIHHHH', bs[:20])
        data_offset = cls.get_data_offset(bs[:20])
        reserved_bits = (b12_13 >> 9) & 7
        flags = {
            'NS': (b12_13 & (1 << 8)) > 0,
            'CWR': (b12_13 & (1 << 7)) > 0,
            'ECE': (b12_13 & (1 << 6)) > 0,
            'URG': (b12_13 & (1 << 5)) > 0,
            'ACK': (b12_13 & (1 << 4)) > 0,
            'PSH': (b12_13 & (1 << 3)) > 0,
            'RST': (b12_13 & (1 << 2)) > 0,
            'SYN': (b12_13 & (1 << 1)) > 0,
            'FIN': (b12_13 & (1 << 0)) > 0
        }
        return super().__new__(
            cls, source_port, destination_port, seq_number, ack_number,
            data_offset, reserved_bits, flags, window_size, checksum,
            urgent_pointer)

    def __str__(self):
        return 'TCP segment from port {} to {}'.format(
            self.source_port, self.destination_port)

    @staticmethod
    def get_data_offset(bs):
        """
        Given the default header (without options) determine the data offset.

        This is in 32 bit words, so can be used to determine the true length
        of the header by multiplying by 4.
        """
        return bs[12] >> 4

    def verify(self):
        assert self.reserved_bits == 0  # reserved for future use in protocol


if __name__ == '__main__':
    parser = argparse.ArgumentParser(
            description='Parse the pcapture of a mystery image download')
    parser.add_argument('path', help='path to pcap file to be parsed')
    parser.add_argument('-o', '--output',
                        help='write to given destination file')
    parser.add_argument('-v', '--verbose', help='show log output',
                        action='store_true')
    args = parser.parse_args()

    requesting_host = (192, 168, 0, 101)  # we know this is us

    if args.verbose:
        def log(s='', indent=0):
            print('{}{}'.format('  ' * indent, s), file=sys.stderr)
    else:
        def log(*args, **kwargs):
            pass

    seq_to_data = {}  # a mapping of seq numbers to data in each segment
    with open(args.path, 'rb') as f:
        fh = FileHeader(f.read(FileHeader.LENGTH))
        log(fh)
        fh.verify()

        while True:
            log()

            # consume and check individual pcap header
            bs = f.read(PcapPacketHeader.LENGTH)
            if not bs:
                break
            pcap_header = PcapPacketHeader(bs)
            log(pcap_header)
            pcap_header.verify()

            # read the entire ethernet frame into memory, and parse and verify
            # its header
            ethernet_frame = f.read(pcap_header.payload_length)
            ethernet_header = EthernetFrameHeader(
                    ethernet_frame[:EthernetFrameHeader.LENGTH])
            log(ethernet_header, indent=1)
            ethernet_header.verify()

            # the payload of the ethernet frame is an IP datagram
            ip_datagram = ethernet_frame[EthernetFrameHeader.LENGTH:]

            # parse and verify the IP datagram header
            ip_header_length = 4 * IpDatagramHeader.get_ihl(ip_datagram[0])
            ip_header = IpDatagramHeader(ip_datagram[:ip_header_length])
            log(ip_header, indent=2)
            ip_header.verify()
            IpDatagramHeader.verify_checksum(ip_datagram[:ip_header_length])

            # the payload of the IP datagram is a TCP segment
            tcp_segment = ip_datagram[ip_header_length:]

            # parse and verify TCP header
            tcp_header_length = 4 * TcpHeader.get_data_offset(
                    tcp_segment[:TcpHeader.DEFAULT_LENGTH])
            tcp_header = TcpHeader(tcp_segment[:tcp_header_length])
            log(tcp_header, indent=3)
            tcp_header.verify()

            # the payload of the TCP segment is a fragment of our HTTP message
            tcp_payload = tcp_segment[tcp_header_length:]

            # consider only the response segments, and collect them by
            # sequence number
            if tuple(ip_header.destination_ip) == requesting_host and not \
                    tcp_header.flags['SYN']:
                seq_to_data[tcp_header.seq_number] = tcp_payload

    http_message = b''.join(d for _, d in sorted(seq_to_data.items()))
    http_header, http_payload = http_message.split(b'\r\n\r\n', 1)
    log(b'\n'.join(http_header.split(b'\r\n')).decode('utf-8'))
    log()

    if args.output:
        with open(args.output, 'wb') as output:
            output.write(http_payload)
        log('OK! wrote {}B to {}'.format(len(http_payload), args.output))
    else:
        sys.stdout.write(http_payload)
        log('OK! wrote {}B to stdout'.format(len(http_payload)))
