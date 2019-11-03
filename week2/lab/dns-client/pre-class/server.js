/* RUNNING THIS PROGRAM
===========================================
node server.js <Domain_Name> <Record Type>

Example ---> node server.js google.com A
*/

/**
 * GOAL: Implementing a DNS client with lower level nodejs API's.
 *       The server will run and you will be able to send requests to it via another proccess
 * 
 * We'll be using "lower level" API's similar to the C-language equivalents to get a feel for what's actually happening
 * when we create sockets, send and recieve messages through them. Some examples: https://beej.us/guide/bgnet/html/single/bgnet.html#twotypes
 * 
 *  4 layer OSI model
 * ===========================================
 * APPLICATION
 *  - DNS, HTTP, DHCP, SSH, FTP.....
 * 
 * TRANSPORT
 * - UDP, TCP
 * 
 * INTERNET LAYER
 * - IP
 * 
 * NETWORK
 * - Ethernet, WIFI,
 * DNS is an application level protocol.
 * 
 * 
 * 
*/





/**
 * What is a datagram (packet is also a synonym)?
 * ===========================================
 * Data in the network layer is called a datagram. It's a super basic bare bones piece of data with info like src & destination.
 * 
 * 
 * What's built on top of datagrams?
 * ===========================================
 * Firstly, remember that everything in the network stack is layered. 
 * Wrapped on top of datagrams, are transport layer data. Transport layer protocols are what dictate what type of data reliablity
 * we want out of our applications.
 * 
 * An application like a video streaming service might use UDP because it doesn't need reliable network delivery (AKA all packets arriving / resending dropped packets)
 * On the other hand other hand, an application like an email or message client WOULD WANT the entire message delivered without any dropped information.
 */
const dgram = require('dgram');
const server = dgram.createSocket('udp4');    // we're using IP protocal V4 here

const config = {
  port: 41234
};

const my_args = process.argv.slice(2);
const [domain_name, record_type] = my_args;
console.log(`Domain name: ${domain_name} \nRecord type: ${record_type}`);


server.on('error', (err) => {
  console.log(`server error:\n${err.stack}`);
  server.close();
});

server.on('message', (message, remoteInfo) => {
  console.log(`server got: ${message} from ${remoteInfo.address}:${remoteInfo.port}`);
});

server.on('listening', () => {
  const address = server.address(config.port);
  console.log(`\nserver listening ${address.address}:${address.port}`);
});


server.bind(41234); // passing a name (AKA an address to the newly created socket) so other people can communicate with us!
                    // in the C api we pass the FD, but in these higher level OO languages, the `server` object maintains a reference to the FD for the socket internally,


                    // you dont want to bind to your local IP like (192.x.x.x) because that changes often, better to do the 0.0.0.0 (loopback) better.






                    // At this point, we've binded to a port. Now we want to send a datagram ❗, we want to send it to a particular location so we use `sendto` ...."man 2 sendto"

// server.send('Hello from server', 41234)




























































`Questions
-------------------------
1) Why is DNS an application layer protocol?

2) Why does DNS use UDP?
When I think about UDP, I think about movie streaming, apps that don't reliable data delivery (email message...bad idea to not send it back to user complete)


`;