const net = require('net');
const config = {
  destination_server: {
    port: 9000,            // port of `server.py` inside of `lab-http-proxy-exercise` folder.
    host: 'localhost'  // hostname of `server.py
  },
  port: 9001,
  host: 'localhost'
};

const socket_pool = [/** Everytime we get a new connection into `reverse_proxy_server`, store its reference.*/];


// Create a new TCP socket. We'll use this socket to connect to your target-server.
const forwarding_socket = new net.Socket();


forwarding_socket.connect(config.destination_server, () => {
  console.log(`[CLIENT@${forwarding_socket.localAddress}:${forwarding_socket.localPort} AKA forwarding_socket]: Connected to ${config.destination_server.host}:${config.destination_server.port}.`) 
  



  // Now that we've established a socket connection to the target server,
  // Create a proxy server to handle incoming requests to it.
  const reverse_proxy_server = net.createServer();
  
  reverse_proxy_server.on('connection', (client_conn_socket) => {
    socket_pool.push(client_conn_socket);
    console.log(`Connection from ${client_conn_socket.remoteAddress}:${client_conn_socket.remotePort}. Total # of connected sockets: ${socket_pool.length}\n`);
  
  
    // Respond when the client has sent us data.
    client_conn_socket.on('data', (data) => {
      console.log(`[CLIENT@${client_conn_socket.remoteAddress}:${client_conn_socket.remotePort}]:\n---DATA--\n${data}---DATA--\n`);
      

      
      // Send the data to the destination server
      forwarding_socket.write(data, 'utf-8');

      // send the data back to original client
      // client_conn_socket.write(data); 
    });

    // When we recieve data back from the end server, send it back to the original requesting client.
    forwarding_socket.on('data', (data) => {
      console.log('Incoming data from end server ↓');
      console.log(data.toString('utf-8'));
      client_conn_socket.write(data);
    })


  
    /**
     * If one of the connected sockets 'closes' or error's out remove it from the `socket_pool` 
    */
    client_conn_socket.on('end', () => {
      const target_index = socket_pool.findIndex((connected_socket) => connected_socket === client_conn_socket);
      socket_pool.splice(target_index, target_index+1);
      console.log(`\nConnected socket fired 'end' event. Socket removed from pool.\nTotal # of connected sockets: ${socket_pool.length}\n`)
    });

    client_conn_socket.on('close', () => {
      const target_index = socket_pool.findIndex((connected_socket) => connected_socket === client_conn_socket);
      socket_pool.splice(target_index, target_index+1);
      console.log(`\nConnected socket fired 'close' event. Socket removed from pool.\nTotal # of connected sockets: ${socket_pool.length}\n`)
    });

  });
  reverse_proxy_server.listen(config.port, config.host, () => {
    console.log(`Running proxy server at ${config.host}:${config.port}`);
  })
});







//Emitted when an error occurs. Unlike net.Socket, the 'close' event will not be emitted directly following this event unless server.close()
forwarding_socket.on('error', (error) => {
  console.log(`Encountered error: ${error.message}. The other server maybe offline.`)
})

// Emitted when the server closes. If connections exist, this event is not emitted until all connections are ended.
forwarding_socket.on('close', (had_error) => {
  if(had_error) {
    console.log(`Closing socket due to a transmission error.`)
    return;
  }
  console.log(`Closing socket`)
})
