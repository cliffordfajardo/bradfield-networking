from collections import namedtuple
import socket
import sys
import random
import struct


GOOGLE_PUBLIC_DNS = ('8.8.8.8', 53)

# See RFC 1035 § 3.2.2 for a full list of types
Q_TYPES = {'A': 1, 'NS': 2, 'CNAME': 5, 'SOA': 6, 'MX': 15, 'TXT': 16}
TYPE_NAMES = dict((v, k) for k, v in Q_TYPES.items())

# See RFC 1035 § 4.1 for the meanings of fields
Header = namedtuple('Header', 'xid flags qdcount ancount nscount arcount')
Question = namedtuple('Question', 'qname qtype qclass')
ResourceRecord = namedtuple('ResourceRecord', 'name type dns_class ttl rdlength rdata')


class Message(object):
    """
    A DNS message, either a query or response.

    All DNS messages consist of a header followed by question, answer, resource
    and additional sections. Each section contains zero or more resource records.
    """
    def __init__(self, header, questions, answers=None, authority=None,
                 additional=None):
        self.header = header
        self.questions = questions
        self.answers = answers or []
        self.authority = authority or []
        self.additional = additional or []

    @classmethod
    def query(cls, name, record_type):
        """
        Construct a query message for the given name and record type.

        Use a random transaction id, set only the RD ("recursive desired") flag,
        and indicate that we have one question and no other records.
        """
        header = Header(random.randint(0, 0xffff), 0x0100, 1, 0, 0, 0)
        questions = [Question(name, record_type, 1)]
        return cls(header, questions)

    @classmethod
    def decode(cls, bs):
        """
        Construct a message by parsing the given bytes
        """
        header = Header(*struct.unpack('!HHHHHH', bs[:12]))
        questions, answers, authority, additional = [], [], [], []

        idx = 12
        for _ in range(header.qdcount):
            name, idx = parse_name(bs, idx)
            qtype, qclass = struct.unpack('!HH', bs[idx:idx+4])
            questions.append(Question(name, TYPE_NAMES[qtype], qclass))
            idx += 4

        sections = (
            (header.ancount, answers),
            (header.nscount, authority),
            (header.arcount, additional)
        )
        # parse each resource record for each section
        for n, records in sections:
            for _ in range(n):
                name, idx = parse_name(bs, idx)
                rtype, rclass, ttl, length = struct.unpack('!HHIH', bs[idx:idx+10])
                idx += 10
                data = parse_record_data(bs, idx, rtype, length)
                idx += length
                r = ResourceRecord(name, rtype, rclass, ttl, length, data)
                records.append(r)

        return cls(header, questions, answers, authority, additional)

    def encode(self):
        """Encode the message as a sequence of bytes"""
        name = b''.join(len(p).to_bytes(1, 'big') + bytes(p, 'ascii')
                        for p in self.questions[0].qname.split('.'))
        return struct.pack(
            '!HHHHHH{}sBHH'.format(len(name)),
            *self.header,
            name,
            0,                          # terminating byte
            Q_TYPES[record_type],       # record type code
            1                           # Qclass of "internet"
        )


def parse_name(bs, i):
    """
    Parse name such as 'ns1.google.com' from a point in a DNS message.

    Note that names can be expressed in two forms: a sequence of labels,
    or zero or more labels followed by a pointer to the suffix of an existing
    list of labels. For instance, if "ns1.google.com" has been expressed
    early, then "ns2.google.com" can be encoded as either ["ns2", "google", "com"]
    or ["ns2", <pointer to ["google", "com"]>].

    The labels themselves are Pascal strings: the first byte encodes the length.
    Since each label must be 63 octets or less, the first two bits of this byte
    can be used to distinguish between label lengths and pointers. If the first
    two bits are `11`, it is a pointer.

    See RFC 1035 § 4.1.4 for details.
    """
    labels = []

    while True:
        b = bs[i]
        if not b:
            break

        # if first two bits are `11`, then the remaining 14 bits are a pointer
        if b >> 6 == 0b11:  # if first two bits are on, it's a pointer
            pointer = ((b & 0x3f) << 8) | bs[i+1]
            result, _ = parse_name(bs, pointer)
            return '.'.join([str(l, 'ascii') for l in labels] + [result]), i + 2

        labels.append(bs[i+1:i+b+1])
        i += b + 1

    return str(b'.'.join(labels), 'ascii'), i + 1  # +1 for null terminator


def parse_record_data(bs, i, rtype, length):
    """
    Parse the data field of a resource record
    """
    if rtype == 1:
        # A record: show as dotted decimal
        return '.'.join(str(int(b)) for b in bs[i:i+length])
    if rtype == 2:
        # NS record: show as name
        return parse_name(bs, i)[0]
    # otherwise, just show bytes
    return str(bs[i:i+length])


# Formatting functions

def _format_header(r):
    return """
ID: {}, FLAGS: {:b}
QUERY: {}, ANSWER: {}, AUTHORITY: {}, ADDITIONAL: {}""".format(
        r.xid, r.flags, r.qdcount, r.ancount, r.nscount, r.arcount)
Header.__repr__ = _format_header


def _format_question(r):
    return '{}\t\t\tIN\t{}'.format(r.qname, r.qtype)
Question.__repr__ = _format_question


def _format_record(r):
    return '{}\t\t{}\tIN\t{}\t{}'.format(r.name, r.ttl, TYPE_NAMES[r.type], r.rdata)
ResourceRecord.__repr__ = _format_record


def _format_message(r):
    j = lambda xs: '\n'.join(str(x) for x in xs) if xs else '<empty>'
    return """
~~~~~~~~~~~~~~~~~~~~
HEADER: {}

QUESTION SECTION:
{}

ANSWER SECTION:
{}

AUTHORITY SECTION:
{}

ADDITIONAL SECTION:
{}
~~~~~~~~~~~~~~~~~~~~
""".format(r.header, j(r.questions), j(r.answers), j(r.authority), j(r.additional))
Message.__repr__ = _format_message


if __name__ == '__main__':
    name, record_type = sys.argv[1], sys.argv[2]
    query = Message.query(name, record_type)

    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)  # IPv4, UDP
    sock.bind(('', 0))
    print('Listening on socket {}'.format(sock.getsockname()))

    print('Sending query:')
    print(query)
    sock.sendto(query.encode(), GOOGLE_PUBLIC_DNS)

    while True:
        data, addr = sock.recvfrom(4096)
        if addr != GOOGLE_PUBLIC_DNS:
            continue  # ignore messages from other hosts!

        response = Message.decode(data)

        if query.header.xid != response.header.xid:
            continue  # ignore responses to _other_ queries

        print('Response:')
        print(response)
        break
