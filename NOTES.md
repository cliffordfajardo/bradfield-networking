# Notes



### Python Implementation
Consider using struct stanrd libary package or bitstruct(recommended by colleague as much more pleasant as struct doesn't deal with individual bits very well)























### Socket Questions
Do sockets create ports? It depends on the type of port. If its a network socket, then yes.
If it's a unix-domain socket, no because its on the same computer. We're just writing to a buffer on our system