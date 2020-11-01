const { verifyChecksum } = require('../ipv4')
const { ok } = require('assert')


const testData1 = Buffer.from([0x45, 0x00, 0x00, 0x3c, 0x1c, 0x46, 0x40, 0x00, 0x40, 0x06,
  0xb1, 0xe6, // <--  checksum
  0xac, 0x10, 0x0a, 0x63, 0xac, 0x10, 0x0a, 0x0c])
const testChecksum1 = Buffer.from([0xb1, 0xe6])

const testData2 = Buffer.from([0x45, 0x48, 0x00, 0x34, 0x1a, 0xff, 0x40, 0x00, 0x29, 0x06,
  0xb8, 0xb6, // <-- checksum
  0xc0, 0x1e, 0xfc, 0x9a, 0xc0, 0xa8, 0x00, 0x65])
const testChecksum2 = Buffer.from([0xb8, 0xb6])

ok(verifyChecksum(testData1, testChecksum1.readUInt16BE()))
ok(verifyChecksum(testData2, testChecksum2.readUInt16BE()))

console.log('IPv4 tests pass')