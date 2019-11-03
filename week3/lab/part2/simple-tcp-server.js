const net = require('net');
const config = {
  port: 4444,
  hostname: 'localhost'
};

// By default this creates a TCP or if you specify a IPC server: http://nodejs.org/api/net.html#net_ipc_support
const tcp_server = net.createServer();
const socket_pool = [/** Everytime we get a new connection, store its reference. This our "connected" sockets pool*/];


tcp_server.on('connection', (socket) => {
  socket_pool.push(socket);
  console.log(`Connection from ${socket.remoteAddress}:${socket.remotePort}; socket added to socket pool. \nTotal # of connected sockets: ${socket_pool.length}\n`);



  // We have references to sockets connected to us, put a listener that will emit when data is written into the socket from either end
  // Since we are inside our server, we can respond to the events that the client is writing to us.
  socket.on('data', (data) => {
    console.log(`[${socket.remoteAddress}:${socket.remotePort}]:  ${data}`);
    socket.write(data); 
  });



  /**
   * If one of the connected sockets 'closes' or error's out remove it from the `socket_pool` 
   */
  socket.on('end', () => {
    const target_index = socket_pool.findIndex((connected_socket) => connected_socket === socket);
    socket_pool.splice(target_index, target_index+1);
    console.log(`\nConnected socket fired 'end' event. Socket removed from pool.\nTotal # of connected sockets: ${socket_pool.length}\n`)
  });

  socket.on('close', () => {
    const target_index = socket_pool.findIndex((connected_socket) => connected_socket === socket);
    socket_pool.splice(target_index, target_index+1);
    console.log(`\nConnected socket fired 'close' event. Socket removed from pool.\nTotal # of connected sockets: ${socket_pool.length}\n`)
  });

});


tcp_server.listen(config.port, config.hostname, ()=> {
  console.log(`TCP server listening on http://localhost:${config.port}`)
});