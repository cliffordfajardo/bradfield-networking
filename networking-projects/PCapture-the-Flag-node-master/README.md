<h1 align="center">PCapture the Flag 🏴‍☠️</h1 >

<p align="center">
  <strong>Parsing tcpdump pcap file to reconstruct an image file</strong>
</p>

## Quick Start

parses pcap file, headers and body of each layer, reconstructs the original http payload into `out.jpg`

```sh
npm start
```

## Checksum Tests

test checksum verification methods

```sh
npm test
```

## Parsing Packet Capture File

- read pcap file
- parse global header
- parse each captured packet : [pcap.js](./pcap.js)
  - parse Link Layer : [ethernet.js](./ethernet.js)
  - parse Network Layer : [ipv4.js](./ipv4.js)
  - parse Transport : [tcp.js](./tcp.js)
      - parse Application Layer payload
  - reconstruct response (app layer receive from server)
- write reconstructed packet data to `out.jpg`

```
parsedPcap packets:
{
  ethernet: {
    ...ethernet headers,
    ipv4: {
      ...ipv4 headers,
        tcp: {
          ...tcp headers,
          app: Application Layer Data (HTTP)
        }
      }
    }
  }
}
```
