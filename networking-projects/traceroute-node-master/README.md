<h1 align="center">🛤 Traceroute node</h1 >

<p align="center">
  <strong>Traceroute program implemented in node</strong>
</p>

## Requirements

```sh
npm i
```

## Usage

```sh
sudo node . [destination ip]
```

## Quick Start

```sh
npm i
sudo node . 1.1.1.1
```

## Traceroute

See [./index.js](./index.js)


## Example Output

```
1       10.33.104.1     0s 2.287974ms
2       157.130.196.213 0s 2.44989ms
3       140.222.225.235 0s 5.214334ms
4       129.250.9.249   0s 13.382138ms
5       129.250.2.2     0s 4.850422ms
6       131.103.117.82  0s 13.425006ms
7       1.1.1.1 0s 12.550213ms
destination reached at hop 7
```

