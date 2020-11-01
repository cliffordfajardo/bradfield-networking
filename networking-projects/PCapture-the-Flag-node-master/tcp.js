const TCPFlags = {
  0b100000: 'URG',
  0b010000: 'ACK',
  0b001000: 'PSH',
  0b000100: 'RST',
  0b000010: 'SYN',
  0b000001: 'FIN',
}

// [flag1, flag2, ...]
const parseTCPFlags = bits =>
  Object.keys(TCPFlags)
    .filter(k => bits & k)
    .map(k => TCPFlags[k])

const parseTCPPacket = (data, pseudoHeader) => {
  let offset = 0
  const sourcePort = data.readUInt16BE(offset)
  const destinationPort = data.readUInt16BE(offset+=2)
  const seq = data.readUInt32BE(offset+=2)
  const ack = data.readUInt32BE(offset+=4)
  const offsetResFlagBits = data.readUInt16BE(offset+=4)
  const dataOffset = (offsetResFlagBits >> 12) // Header Length
  const headerLength = dataOffset * 4
  const flags = parseTCPFlags(offsetResFlagBits & 0x3f)
  const window = data.readUInt16BE(offset+=2)
  const checksum = data.readUInt16BE(offset+=2)
  const urgentPointer = data.readUInt16BE(offset+=2)

  const checksumVerified = verifyChecksum(
    pseudoHeader,
    data,
    checksum
  )

  let app = null
  if(data.length > headerLength){
    // @TODO parse options
    app = data.slice(headerLength)
  }

  return {
    sourcePort,
    destinationPort,
    seq,
    ack,
    dataOffset,
    flags,
    window,
    checksum,
    checksumVerified,
    urgentPointer,
    length: data.length,
    app,
  }
}

/*
 * - pseudoHeader:
 *   - 12 byte pseudo header from IP headers
 * - tcpPacket:
 *   - the rest of the tcp header and data bytes
 *   - checksum field will be skipped during calculation
 * - verification:
 *   - split tcpPacket into 16bit sets
 *   - add each 16bit set together
 *   - add tcpChecksum (one's complement of previous sets)
 *   - return true if answer is 0xffff
 */
const verifyChecksum = (pseudoHeader, tcpPacket, tcpChecksum) => {
  const checksumOffset = 16
  const data = Buffer.concat([
    pseudoHeader,
    tcpPacket.slice(0, checksumOffset),
    tcpPacket.slice(checksumOffset+2), // skip checksum, assume zeros
  ])

  return (new Array(Math.ceil(data.length / 2))
    .fill(null)
    .map((_, i) => data.readUInt16BE(i*2))
    .reduce((checksum, sub) => {
      let sum = checksum + sub
      return sum > 0xffff ?
        (sum & 0xffff) + 1 : // 'carry' the one
        sum
    }) ^ 0xffff) === tcpChecksum
    // or: add tcpChecksum should equal 0xffff
}

module.exports = {
  parseTCPPacket,
  verifyChecksum
}
