# Part 1: Basic TCP Echo server

## Goal
The goal is to create a tcp server that will echo back to it's client whatever it recieves.

## The Journey
In creating the tcp server, we want to avoid using the higher level API's such as `http`, `https` to create an http/s server. 
Why? By using the lower level networking API's I get the opportunity to:
- learn what's actually happening when I'm using the higher level API's. Both `http` and `https` use the `net` module internally to create the server. I will use `net` in my implemention.



So far we have:
- `tcp-client.js`: 
  - All it does is send a request to `tcp-server.js`. We actually didn't even need to create this file. We could have used an existing client that is already available to use (instead of creating one like I did):
    - any web browser: 
      - once `tcp-server` is running, in your browser visit its URL. NOTE: you'll get an error `ERR_INVALID_HTTP_RESPONSE` because our browser doesn't like that we're not sending a well formatted HTTP response. SEE `tcp-server2.js` which handles this.
    - command line tool: there are several command line tools that we can use to directly talk to our server. For example:
      - `nc` a coommand line tool on almost all unix based systems.
      - `simplehttpserver`
    - our own client: like I did in creating `tcp-client.js` you can create your own TCP client.

- `tcp-server.js`:  All it does it take incoming requests from other clients and returns back exactly what the client gave it; it's basically an echo server.






## Development

On one of your terminal tabs, run:

```
node tcp-server.js
```

Now that the main server is running, in another terminal run:

```
node simple-tcp-client
```

Another way to create multiple clients easily, is to run the following command in new terminal tabs:

```
nc localhost 4444
```

Then you can hit enter and type a message and it will get fired off to `tcp-server.js` which is running on `localhost:4444`
