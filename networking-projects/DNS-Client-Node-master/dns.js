// https://tools.ietf.org/rfc/rfc1035.txt
const QR = {
  0: 'QUERY',
  1: 'RESPONSE',
}
const OPCODE = {
  0: 'STANDARD'
}
const RCODE = {
  0: 'No errors',
  1: 'Format error',
}
const TYPE = {
  0x0001: 'A', // a host address
  0x0002: 'NS', // an authoritative name server
  0x0003: 'MD', // a mail destination (Obsolete - use MX)
  0x0004: 'MF', // a mail forwarder (Obsolete - use MX)
  0x0005: 'CNAME', // the canonical name for an alias
  0x0006: 'SOA', // marks the start of a zone of authority
  0x0007: 'MB', // a mailbox domain name (EXPERIMENTAL)
  0x0008: 'MG', // a mail group member (EXPERIMENTAL)
  0x0009: 'MR', // a mail rename domain name (EXPERIMENTAL)
  0x000a: 'NULL', // a null RR (EXPERIMENTAL)
  0x000b: 'WKS', // a well known service description
  0x000c: 'PTR', // a domain name pointer
  0x000d: 'HINFO', // host information
  0x000e: 'MINFO', // mailbox or mail list information
  0x000f: 'MX', // mail exchange
  0x0010: 'TXT', // text strings
}
const QTYPE = { // rfc 1035
  ...TYPE,
  0x00fc: 'AXFR', // A request for a transfer of an entire zone
  0x00fd: 'MAILB', // A request for mailbox-related records (MB, MG or MR)
  0x00fe: 'MAILA', // A request for mail agent RRs (Obsolete - see MX)
  0x00ff: '*', // A request for all records
}
const CLASS = {
  0x0001: 'IN', // the Internet
  0x0002: 'CS', // the CSNET class (Obsolete - used only for examples in some obsolete RFCs)
  0x0003: 'CH', // the CHAOS class
  0x0004: 'HS', // Hesiod [Dyer 87]

}
const QCLASS = {
  ...CLASS,
  0x00ff: '*', // any class
}

const root = Buffer.from([0x00])
const firstValidDomainCharCode = 'A'.charCodeAt(0)

const intToIpv4 = ipInt =>
  [
    (ipInt>>>24),
    ipInt>>16 & 0xff,
    ipInt>>8 & 0xff,
    ipInt & 0xff
  ].join('.')

// input
// - domain
// - type
// - class
const encodeQuery = input => {
  // create header, hardcode 1 question
  const header = Buffer.alloc(12)

  // header
  header.writeUInt16BE(0x01) // id
  header.writeUInt16BE(0b0000000100000000, 2) // flags
  header.writeUInt16BE(0x01, 4) // questions count
  header.writeUInt16BE(0x00, 6) // answer count
  header.writeUInt16BE(0x00, 8) // authoritative count
  header.writeUInt16BE(0x00, 10) // additonal count

  // questions
  let question = input
    .split('.')
    .map(name => Buffer.concat([Buffer.from([name.length]), Buffer.from(name)]))
    .reduce((names, name) => Buffer.concat([names, name]), Buffer.from([]))

  const qtype = Buffer.from([0x00, 0x01])
  const qclass = Buffer.from([0x00, 0x01])

  question = Buffer.concat([
    question,
    root,
    qtype,
    qclass,
  ])

  return Buffer.concat([header, question])
}

const parseResponseFlags = b => {
  const qr = QR[b>>0xF]
  const opCode = OPCODE[b>>0xB & 0xF]
  const authoritativeAnswer = !!(b>>0xA & 1)
  const truncated = !!(b>>0x9 & 1)
  const recursionDesired = !!(b>>0x8 & 1)
  const recursionAvailable = !!(b>>0x7 & 1)
  // bits 9, 10, 11 are reserved
  const responseCode = RCODE[b & 0xF]

  return {
    qr,
    opCode,
    authoritativeAnswer,
    truncated,
    recursionDesired,
    recursionAvailable,
    responseCode
  }
}

/*
 * only parse until the root marker
 * instead of counting each bit from the length value
 * anything less than firstValidDomainCharCode -> '.'
 * return name and length of entire domain (indexOf root)
 *
 * args
 *   bits: the only thing needed to start parsing
 *   nameLength: used for recursive parsing
 *   final return:
 *     [
 *       name: the parsed domain name
 *       length: total length of domain name
 *     ]
 */
const parseDomainName = (bits, nameLength = null, [name, length] = ['',0]) => {
  const char = bits.readUInt8() // can be length or letter

  // char is root, done
  if (char == 0) return [name + '.', length+1]

  // char is length of name
  if (char < firstValidDomainCharCode) // set nameLength
    return parseDomainName(
      bits.slice(1),
      char,
      [
        name + '.', // parse length char to mean dot
        length + 1
      ]
    )

  // char is letter in name
  return parseDomainName(
    bits.slice(1),
    nameLength-1,
    [
      name + String.fromCharCode(char),
      length + 1
    ]
  )
}

/*
 * if first two bits of a domain name is 1
 * this is a pointer to the first occurrance of the domain name
 *
 *   |   ptr value  |
 *   |     vv       |
 * 11000000 00001100
 * ^^           ^
 * |            |- ptr value is 12
 * |
 * |- bits mean the rest of the 14 bits are value of the ptr
 *
 * in the case of a pointer, return the length of the ptr, which is 2
 *
 * @args:
 *   response: entire response to deref pointers
 *   nameBytes: response sliced to beginning of this domain name
 */
const getDomainName = (response, nameBytes) => {
  const isPtrMask = 0xc000
  const valueMask = 0x3fff

  const ptrMask = 0xc000
  const bits = nameBytes.readUInt16BE()

  const first2b = nameBytes.readUInt16BE()

  if ((first2b & isPtrMask) == isPtrMask){

    const valuePtr = first2b & valueMask
    const [domain, _] = parseDomainName(response.slice(valuePtr))
    return [domain, 2] // ptr size
  } else {
    return parseDomainName(nameBytes)
  }
}

const parseRdata = (type, response, data) => {
  switch(type){
    case 'A':
      return intToIpv4(data.readUInt32BE())
    case 'NS':
    case 'CNAME':
      return getDomainName(response, data)
    default:
      console.log(`parseRdata TYPE:${type} not implemented`)
      return 'NOT IMPLEMENTED'
  }
}

const parseQuestion = (response, offset) => {
  const questionBytes = response.slice(offset)
  let [domain, length] = getDomainName(response, questionBytes)
  const qtype = QTYPE[questionBytes.readUInt16BE(length)]
  const qclass = QCLASS[questionBytes.readUInt16BE(length+2)]

  return {
    domain,
    qtype,
    qclass,
    offset: length+4 // length of name + 4bytes for qtype and qclass
  }
}

const parseAnswer = (response, offset) => {
  const answerBytes = response.slice(offset)
  let [domain, length] = getDomainName(response, answerBytes)
  const type = TYPE[answerBytes.readUInt16BE(length)]
  const klass = answerBytes.readUInt16BE(length+2)
  const ttl = answerBytes.readUInt32BE(length+4)
  const rdlength = answerBytes.readUInt16BE(length+8)
  length += 10
  const rdata = parseRdata(type, response, answerBytes.slice(length, length+rdlength))
  length+=rdlength

  return {
    domain,
    type,
    klass,
    ttl,
    rdlength,
    rdata,
    offset: length
  }
}

const parseResponse = response => {

  const id = response.readUInt16BE()
  const flags = parseResponseFlags(response.readUInt16BE(2))
  let questionsCount = response.readUInt16BE(4)
  let answersCount = response.readUInt16BE(6)
  const authoritativeCount = response.readUInt16BE(8)
  const additionalCount = response.readUInt16BE(10)

  const header = {
    id,
    flags,
    questionsCount,
    answersCount,
    authoritativeCount,
    additionalCount,
  }

  let offset = 12
  const questions = []
  while(questionsCount --> 0){
    const question = parseQuestion(response, offset)
    questions.push(question)
    offset += question.offset
  }

  const answers = []
  while(answersCount --> 0){
    const answer = parseAnswer(response, offset)
    answers.push(answer)
    offset += answer.offset
  }

  // @todo parse authoritative

  // @todo parse additional

  return ({ header, questions, answers })
}

module.exports = { encodeQuery, parseResponse }
