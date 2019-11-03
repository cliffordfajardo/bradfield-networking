create socket (os soes that), we get a FD back

```
man socket
```


socket (creates an enpoint for communication) is like writing a file (we get a fd),

Server sends of a series of syscalls to accept connections 
Client creates a connections
.....
now client and server have their own sockets 
I write to a socket, as if I'm writing to a file 
you read from your socket like your reading from a file

But really, under the hood, we're using TCP and messages are getting segmented, maybe some of the datagrams are dropped and retried

lots of the TCP IP stack is abstracted away from us, we have  a nice API to `write_bytes` and `read_bytes`





## Exercises
We're going to implement IPV4 sockets...PF_INET



# Real life scenarios
One day you might implement a web server and database, you anticipate your going to take network traffic over the internet but then you decide to run the database and server on the same machine
but not change any code (or very little) ..socket abstraction is good, because all you'll need to do is swap out the domain ...now local communicaiton then over the network...




# When wouild we use a SOCK_STREAM over a SOCK_DGRAM

stream (TCP sending bit by bit)
DGRAM (UDP sending fully formed messages)





# To be a DNS client, what syscall do we need to call?
- See `man bind`: binds a name to a socket! You do this before making a connection to the dns serber





# Lets say we want to make an HTTP request
Send a message ...we'll need a stream socket after opening the socket we'll need to connect.



Anytime you want to be accepting requests from others you need to bind to a port.