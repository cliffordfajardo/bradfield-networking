// http://www.tcpipguide.com/free/t_IPDatagramGeneralFormat.htm

const { parseTCPPacket } = require('./tcp')

const bitSet = (data, check) => (data & check) === check

const FLAGS = {
  0b100: 'Reserved (not used)',
  0b010: 'DF (Don\'t Fragment)',
  0b001: 'MF (More Fragments)',
}

const PROTOCOL = {
  0x00: 'Reserved',
  0x01: 'ICMP',
  0x02: 'IGMP',
  0x03: 'GGP',
  0x04: 'IP-in-IP Encapsulation',
  0x06: 'TCP',
  0x08: 'EGP',
  0x11: 'UDP',
  0x32: 'Encapsulating Security Payload (ESP) Extension Header',
  0x33: 'Authentication Header (AH) Extension Header',
}

// [ flag1, flag2 ]
const parseIPV4Flags = data => Object.keys(FLAGS)
  .filter(flag => bitSet(data, flag))
  .map(flag => FLAGS[flag])

/*
 * for upper layer checksum
 * 12 bytes
 * - 4byte src address
 * - 4byte dest address
 * - 1byte reserved (all zeros)
 * - 1byte protocol
 * - 2byte tcp length (computed)
 */
const createPseudoHeader = (
  sourceAddress,
  destinationAddress,
  protocolHeader,
  tcpLength
) => {
  const ph = Buffer.alloc(12)
  ph.writeUInt32BE(sourceAddress)
  ph.writeUInt32BE(destinationAddress, 4)
  ph.writeUInt8(protocolHeader, 9) // skip 1byte reserved
  ph.writeUInt16BE(tcpLength, 10)
  return ph
}

const parseIPv4Packet = data => {
  let offset = 0
  const byte0 = data.readUInt8(offset)
  const version = byte0 >> 4
  const internetHeaderLength = byte0 & 0xF
  const tos = data.readUInt8(offset+=1)
  const totalLength = data.readUInt16BE(offset+=1)
  const identification = data.readUInt16BE(offset+=2)
  const flagsFragmentOffsetBytes = data.readUInt16BE(offset+=2)
  const flags = parseIPV4Flags(flagsFragmentOffsetBytes >> 3)
  const fragmentOffset = flagsFragmentOffsetBytes & 0x1F
  const ttl = data.readUInt8(offset+=2)
  const protocolHeader = data.readUInt8(offset+=1)
  const protocol = PROTOCOL[protocolHeader]
  const headerChecksum = data.readUInt16BE(offset+=1)
  const sourceAddress = data.readUInt32BE(offset+=2)
  const destinationAddress = data.readUInt32BE(offset+=4)
  const optionsLength = internetHeaderLength - 5
  let optionBytes = 0
    if(optionsLength){
      optionBytes = data.readUInt32BE(offset+=(4*optionsLength)).toString(2) // with padding
    }else{
      offset+=4 // with padding
    }

  // for upper layer's checksum
  const pseudoHeader = createPseudoHeader(sourceAddress, destinationAddress, protocolHeader, data.length - offset)
  const checksumVerified = verifyChecksum(
    data.slice(0,20),
    headerChecksum
  )

  const tcp = parseTCPPacket(data.slice(offset), pseudoHeader)

  return {
    version,
    internetHeaderLength,
    tos,
    totalLength,
    identification,
    flags,
    fragmentOffset,
    ttl,
    protocol,
    headerChecksum,
    checksumVerified,
    sourceAddress,
    destinationAddress,
    optionBytes,
    tcp
  }
}

/*
 * - ipv4headers
 *   - checksum field (6th set) needs to be zeroed out during calculation
 * - verification:
 *   - split tcpPacket into 16bit sets
 *   - add each 16bit set together
 *   - if the sum is greater than 0xffff, remove largest bit and increment by 1
 *   - add ipv4Checksum (one's complement of previous sets)
 *   - return true if answer is 0xffff
 */
const verifyChecksum = (ipv4headers, ipv4Checksum) =>
  (new Array(Math.ceil(ipv4headers.length / 2))
    .fill(null)
    .map((_, i) => i == 5 ? 0 : // skip checksum field
      ipv4headers.readUInt16BE(i*2, (i*2)+16)
    )
    .reduce((checksum, sub) => {
      let sum = checksum + sub
      return sum > 0xffff ?
        (sum & 0xffff) + 1 : // 'carry' the one
        sum
    }) ^ 0xffff) === ipv4Checksum

module.exports = {
  parseIPv4Packet,
  verifyChecksum
}
