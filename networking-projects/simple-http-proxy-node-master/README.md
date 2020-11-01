<h1 align="center">⛓️ Simple HTTP Proxy</h1 >

<p align="center">
  <strong>Simple HTTP Proxy</strong>
</p>

## Quick Start

### start server

_set `UPSTREAM_HOST` to almost any HTTP server listening on port 80_

```sh
env UPSTREAM_HOST="linuxcommand.org" node .
```

### test proxy

```sh
curl -vs http://localhost:8080 | head
```

```sh
* Rebuilt URL to: http://localhost:8080/
*   Trying 127.0.0.1...
* TCP_NODELAY set
* Connected to localhost (127.0.0.1) port 8080 (#0)
> GET / HTTP/1.1
> Host: localhost:8080
> User-Agent: curl/7.58.0
> Accept: */*
>
< HTTP/1.1 200 OK
< Server: nginx/1.14.0 (Ubuntu)
< Date: Fri, 14 Feb 2020 01:36:27 GMT
< Content-Type: text/html
< Content-Length: 4005
< Connection: keep-alive
< Vary: Accept-Encoding
< Cache-Control: max-age=600
< Expires: Fri, 14 Feb 2020 01:41:40 GMT
< X-From: sfp-web-8
< X-Proxy-Name: Simple HTTP Proxy
<
{ [4005 bytes data]
* Connection #0 to host localhost left intact




        <!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN"
        "http://www.w3.org/TR/html4/loose.dtd">

        <html lang="en">
        <head>
                <link rel="SHORTCUT ICON" href="http://linuxcommand.org/favicon.png">

```

### server output

```
listening on 127.0.0.1:8080
client connected:       127.0.0.1:8080
connection established with backend:    10.33.109.176:41934
sent proxied response to client:        127.0.0.1:8080
backend connection closed:      10.33.109.176:41934
client disconnected:    127.0.0.1:8080
```

## Proxy

See [./proxy.js](./proxy.js)

