const raw = require("raw-socket");
const DESTINATION_IP = process.argv[2];
if(!DESTINATION_IP){
  throw new Error('Missing argument DESTINATION_IP')
}

const HEADER_LENGTH = 12;
let found = false

var socketLevel = raw.SocketLevel.IPPROTO_IP;
var socketOption = raw.SocketOption.IP_TTL;

const hops = 64
const timers = {}
let timeoutId
let socket = raw.createSocket({
  protocol: raw.Protocol.ICMP
});

socket.on("close", function() {
  clearTimeout(timeoutId)
  console.log("socket closed");
  process.exit(-1);
});

socket.on("error", function(error) {
  clearTimeout(timeoutId)
  console.log("error: " + error.toString());
  process.exit(-1);
});

socket.on("message", (buffer, source) => {
  clearTimeout(timeoutId)
  if(source === DESTINATION_IP){
    found = true
    const id = buffer.readUInt16BE(24)
    const [seconds, nanoseconds] = process.hrtime(timers[id])
    console.log(`${id}\t${source}\t${seconds}s ${nanoseconds/1000000}ms`)
    console.log("destination reached at hop", id);
    return process.exit(0)
  }
  // console.log("received " + buffer.toString('hex'));
  const id = buffer.readUInt16BE(52)

  const [seconds, nanoseconds] = process.hrtime(timers[id])
  console.log(`${id}\t${source}\t${seconds}s ${nanoseconds/1000000}ms`)
  timeoutId = sendICMP(id+1, hops)
});

const sendICMP = (ttl, max) => {
  if(ttl >= max) return

  timers[ttl] = process.hrtime()

  let header = Buffer.alloc(HEADER_LENGTH);
  header.writeUInt8(0x8, 0); //type
  header.writeUInt16BE(ttl, 4); //id
  raw.writeChecksum(header, 2, raw.createChecksum(header));

  socket.send(header, 0, HEADER_LENGTH, DESTINATION_IP, function beforeSend() {
    socket.setOption(socketLevel, socketOption, ttl);
  }, function afterSend( error, bytes) {
    if (error) console.log(error.toString());
  });

  return setTimeout(() => {
    console.log(`${ttl}\t*`)
    clearTimeout(timeoutId)
    timeoutId = sendICMP(ttl+1)
  }, 1500)
}


timeoutId = sendICMP(1, hops)

