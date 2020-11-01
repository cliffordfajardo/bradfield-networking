const net = require('net')
const server = net.createServer()
const { forwardToUpstream } = require('./proxy')

const SERVER_PORT = process.env.PORT || 8080
const SERVER_HOST = process.env.HOST || '127.0.0.1'
global.UPSTREAM_PORT = process.env.UPSTREAM_PORT || 80
global.UPSTREAM_HOST = process.env.UPSTREAM_HOST || 'linuxcommand.org'
global.PROXY_NAME = process.env.PROXY_NAME || 'Simple HTTP Proxy'

server.listen(SERVER_PORT, SERVER_HOST, () => {
  console.log(`listening on ${server.address().address}:${server.address().port}`);
});

server.on('connection', socket => {
  const { address: clientAddress, port: clientPort,} = socket.address()
  socket.address = clientAddress
  socket.port = clientPort

  console.log(`client connected: \t${clientAddress}:${clientPort}`);

  socket.setEncoding('utf8');
  socket.on('data', forwardToUpstream.bind(global, socket))
  socket.on('end', () => console.log(`client disconnected: \t${clientAddress}:${clientPort}`))
});

server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.log(`Error - Address in use`);
  }
  console.log(e);
});
server.on('close',() => {
  console.log(`Closed}`);
});
