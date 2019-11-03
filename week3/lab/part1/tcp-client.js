const net = require('net');

const config = {
  port: 1111,           // port of other server
  host: 'localhost' // hostname of other server
};


const client = new net.Socket();
client.connect(config, () => {
  console.log(`[CLIENT@${client.localAddress}:${client.localPort}]: Connected.`)
  client.write(`Hello from CLIENT.`)
});
