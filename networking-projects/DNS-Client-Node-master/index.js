// https://nodejs.org/docs/latest-v10.x/api/dgram.html
const { createSocket } = require('dgram');
const client = createSocket('udp4');

const message = process.argv[2] || 'ubuntu.com'

const { encodeQuery, parseResponse } = require('./dns');

const DNSPORT = 53
const DNSHOST = '8.8.8.8'

client.on("error", err => {
  console.log(`client error:\n${err.stack}`);
  client.close();
});

client.on("message", (msg, {address, port}) => {
  console.log(parseResponse(msg));
  client.close();
});

client.on("listening", () => {
  const { address, port } = client.address();
  // console.log(`client listening ${address}:${port}`);
});

client.on("connect", () => {
  // console.log("connected");
});

client.on("close", () => {
  // console.log("close");
});

client.send(encodeQuery(message), DNSPORT, DNSHOST, err => {
  if (err) console.log(err);
});
