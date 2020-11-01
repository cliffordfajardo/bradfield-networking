# Ping

# Motivation
This module implements a basic version of the `ping` command which uses `ICMP` protocol.
I decided to implement a basic version of `ping` first, since it's a smaller scoped program, before
diving into builing my implementation of `traceroute`, which is similar to `ping`, but it does more
like counting the # of hops between my desitination and reporting it back to me, whereas ping doesn't
include the # of hops to my destination.

# Concerning the `raw-sockets` module.
Currently nodejs doesnt provide support for accessing raw sockets, only datagram and stream sockets.
raw-sockets wraps some C++ code that exposes to use the ability to pass to the `socket` syscall
the `SOCK_RAW` option.



# Debugging
After trying to install `raw-socket` on node v13.3.0 I recieved the following error:

```
> node-gyp rebuild

No receipt for 'com.apple.pkg.CLTools_Executables' found at '/'.

No receipt for 'com.apple.pkg.DeveloperToolsCLILeo' found at '/'.

No receipt for 'com.apple.pkg.DeveloperToolsCLI' found at '/'.

gyp: No Xcode or CLT version detected!
gyp ERR! configure error 
gyp ERR! stack Error: `gyp` failed with exit code: 1
gyp ERR! stack     at ChildProcess.onCpExit (/usr/local/lib/node_modules/npm/node_modules/node-gyp/lib/configure.js:351:16)
gyp ERR! stack     at ChildProcess.emit (events.js:219:5)
gyp ERR! stack     at Process.ChildProcess._handle.onexit (internal/child_process.js:274:12)
gyp ERR! System Darwin 19.0.0
gyp ERR! command "/usr/local/bin/node" "/usr/local/lib/node_modules/npm/node_modules/node-gyp/bin/node-gyp.js" "rebuild"
gyp ERR! cwd /Users/cliffordfajardo/Desktop/bradfield-networking/week5/ping/node_modules/raw-socket
gyp ERR! node -v v13.3.0
gyp ERR! node-gyp -v v5.0.5
gyp ERR! not ok 
npm WARN ping@1.0.0 No repository field.

npm ERR! code ELIFECYCLE
npm ERR! errno 1
npm ERR! raw-socket@1.7.0 install: `node-gyp rebuild`
npm ERR! Exit status 1
npm ERR! 
npm ERR! Failed at the raw-socket@1.7.0 install script.
npm ERR! This is probably not a problem with npm. There is likely additional logging output above.
```

After googling the error: `No Xcode or CLT version detected` I was directed to a github comment to attempt the following `xcode-select --install` but got this:

```
xcode-select: error: command line tools are already installed, use "Software Update" to install updates
```

In that same thread it was was suggested to uninstall and re-install xcode, which solved my issue 🎉:

```
sudo rm -rf $(xcode-select -print-path)
xcode-select --install
```

