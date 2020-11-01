# Traceroute
This module implements a basic version of the `traceroute` command which uses `ICMP` protocol.

# Motivation

# Concerning the `raw-sockets` module.
Currently nodejs doesnt provide support for accessing raw sockets, only datagram and stream sockets.
raw-sockets wraps some C++ code that exposes to use the ability to pass to the `socket` syscall
the `SOCK_RAW` option.