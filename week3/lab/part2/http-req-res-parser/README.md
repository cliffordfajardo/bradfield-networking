# Part 2: Forwarding

### What I've Done
- 1. created a reverse-proxy-server. Currently it forwards a request to an end server,
recieves the response back from the end server and then returns it back to the original client.
  - hitting it with `curl` works.
  - hitting it with `google chrome` works. FYI: if for whatever reason your getting an `ERR_INVALID_HTTP_RESPONSE` its because you are not returning
    a valid HTTP response. A valid HTTP response must follow a certain format, otherwise a web browser will reject it.

### What I haven't Done 
- 1. create a barebones tcp server. Currently I'm using the server `server.py`
