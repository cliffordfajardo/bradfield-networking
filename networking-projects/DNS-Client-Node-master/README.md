<h1 align="center">📖 DNS Client</h1 >

<p align="center">
  <strong>Simple DNS client and Answer parser</strong>
</p>

## Quick Start

```sh
node . [domain name]
```

## DNS Parsing / Encoding

See [./dns.js](./dns.js)


## Example 1

`node .` _defaults to ubuntu.com_

```javascript
{
  header: {
    id: 1,
    flags: {
      qr: 'RESPONSE',
      opCode: 'STANDARD',
      authoritativeAnswer: false,
      truncated: false,
      recursionDesired: true,
      recursionAvailable: true,
      responseCode: 'No errors'
    },
    questionsCount: 1,
    answersCount: 6,
    authoritativeCount: 0,
    additionalCount: 0
  },
  questions: [ { domain: '.ubuntu.com.', qtype: 'A', qclass: 'IN', offset: 16 } ],
  answers: [
    {
      domain: '.ubuntu.com.',
      type: 'A',
      klass: 1,
      ttl: 580,
      rdlength: 4,
      rdata: '91.189.89.110',
      offset: 16
    },
    {
      domain: '.ubuntu.com.',
      type: 'A',
      klass: 1,
      ttl: 580,
      rdlength: 4,
      rdata: '91.189.90.59',
      offset: 16
    },
    {
      domain: '.ubuntu.com.',
      type: 'A',
      klass: 1,
      ttl: 580,
      rdlength: 4,
      rdata: '91.189.90.58',
      offset: 16
    },
    {
      domain: '.ubuntu.com.',
      type: 'A',
      klass: 1,
      ttl: 580,
      rdlength: 4,
      rdata: '91.189.89.103',
      offset: 16
    },
    {
      domain: '.ubuntu.com.',
      type: 'A',
      klass: 1,
      ttl: 580,
      rdlength: 4,
      rdata: '91.189.89.118',
      offset: 16
    },
    {
      domain: '.ubuntu.com.',
      type: 'A',
      klass: 1,
      ttl: 580,
      rdlength: 4,
      rdata: '91.189.89.115',
      offset: 16
    }
  ]
}

```

## Example 2

`node . bradfieldcs.com`

```javascript
{
  header: {
    id: 1,
    flags: {
      qr: 'RESPONSE',
      opCode: 'STANDARD',
      authoritativeAnswer: false,
      truncated: false,
      recursionDesired: true,
      recursionAvailable: true,
      responseCode: 'No errors'
    },
    questionsCount: 1,
    answersCount: 2,
    authoritativeCount: 0,
    additionalCount: 0
  },
  questions: [
    {
      domain: '.bradfieldcs.com.',
      qtype: 'A',
      qclass: 'IN',
      offset: 21
    }
  ],
  answers: [
    {
      domain: '.bradfieldcs.com.',
      type: 'A',
      klass: 1,
      ttl: 299,
      rdlength: 4,
      rdata: '104.27.148.106',
      offset: 16
    },
    {
      domain: '.bradfieldcs.com.',
      type: 'A',
      klass: 1,
      ttl: 299,
      rdlength: 4,
      rdata: '104.27.149.106',
      offset: 16
    }
  ]
}

```
