// https://wiki.wireshark.org/Ethernet

const { parseIPv4Packet } = require('./ipv4')

const TYPE = {
  'default': '(IEEE 802.3 and/or 802.2)', // length field
  '0800': 'IP(v4)',
  '0806': 'ARP',
  '8137': 'IPX',
  '86dd': 'IPv6',
}

// { type:TYPE, length:int|null }
// length is null for type field
const parseTypeLength = buf => {
  let type = TYPE['default']
  let length = null

  // is IEE 802.3/802.2 ?
  if(!TYPE.hasOwnProperty(buf.toString('hex'))){
    length = buf.readUInt16BE(0)
  } else {
    type = TYPE[buf.toString('hex')]
  }

  return { type, length }
}

// Preamble is filtered out by Wireshark
const parseEthernetFrame = data => {
  let offset = 0
  const destMACAddr = data.slice(offset, offset+=6).toString('hex')
  const srcMACAddr = data.slice(offset, offset+=6).toString('hex')
  const { type, length } = parseTypeLength(data.slice(offset, offset+=2))

  // not sure how fcs works yet
  // const userData = data.slice(offset, data.length-32)
  // const fcs = data.readUInt32BE(data.length-32)

  const userData = data.slice(offset)
  const ipv4 = parseIPv4Packet(userData)
  const fcs = 0

  return {
    destMACAddr,
    srcMACAddr,
    type,
    length,
    ipv4,
    fcs
  }
}

module.exports = {
  parseEthernetFrame
}
