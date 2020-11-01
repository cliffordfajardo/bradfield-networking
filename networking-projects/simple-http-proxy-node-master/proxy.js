const { Socket } = require('net')

const parseHeader = kv => {
  const delimiter = kv.indexOf(':')
  const k = kv.slice(0, delimiter)
  const v = kv.slice(delimiter+1).trim()
  return { k, v }
}

const parsePayload = req => {

  const [unparsedHeaders, ...body] = req.split('\r\n\r\n')
  const [statusLine, ...headers] = unparsedHeaders.split('\r\n')
  let statusCode, httpVersion, path, method

  if (statusLine.startsWith('HTTP') ) {
    [httpVersion, statusCode] = statusLine.split(' ')
  } else {
    [method, path, httpVersion] = statusLine.split(' ')
  }

  return {
    statusLine,
    httpVersion,
    headers: headers.map(parseHeader).reduce((h, {k, v}) => ({ ...h, [k]:v}), {}),
    body: body.join('\r\n'),

    // requests
    method,
    path,

    // responses
    statusCode
  }
}

const encodeHeaders = headers => (encoded, name) =>   `${encoded}\r\n${name}: ${headers[name]}`

const findHttpContentLength = payload => {
  let httpContentLength = null
  let contentLengthMatch = payload.match(/content-length: (\d+)\r\n/i)
  if(contentLengthMatch !== null){
    httpContentLength = parseInt(contentLengthMatch[1])
  }
  return httpContentLength
}

const addResponseHeader = headers => ({
  ...headers,
  'X-Proxy-Name': PROXY_NAME
})

const addRequestHeaders = headers => ({
  ...headers,
  'Host': UPSTREAM_HOST,
  'X-Proxy-Request-Host': headers.Host,
  'X-Proxy-Name': PROXY_NAME
})

const forwardToUpstream = (client, reqData) => {
  const { statusLine, headers, body } = parsePayload(reqData)
  // http request hooks:
  // caching
  // logging


  let upstreamPayload = ''
  let httpContentLength = null

  const backend  = new Socket();
  backend.setEncoding('utf8');
  backend.connect(UPSTREAM_PORT, UPSTREAM_HOST, () => {
    const { address: backendAddress, port: backendPort, } = backend.address()
    backend.address = backendAddress
    backend.port = backendPort

    console.log(`connection established with backend: \t${backendAddress}:${backendPort}`);

    // http request hooks:
    // transformations
    let transformedHeaders = addRequestHeaders(headers)
    let encodedTransformedHeaders = Object.keys(transformedHeaders)
      .reduce(encodeHeaders(transformedHeaders), '')

    // send request to backend
    backend.write(statusLine)
    backend.write(encodedTransformedHeaders)
    backend.write('\r\n\r\n')
    backend.write(body)
  });

  // response from backends
  backend.on('data', chunk => {
    upstreamPayload += chunk

    if( httpContentLength === null ) {
      httpContentLength = findHttpContentLength(upstreamPayload)
    }

    // close connection to backend
    let bodyLength = upstreamPayload.length - upstreamPayload.indexOf('\r\n\r\n')
    if( bodyLength >= (httpContentLength || Math.Infinity) && bodyLength <= upstreamPayload.length){
      backend.end()
    }
  });

  backend.on('end', () => {
    let {
      statusLine,
      headers: upstreamHeaders,
      body: upstreamBody,
    } = parsePayload(upstreamPayload)

    // http request hooks:
    // logging
    // transformations
    // compression

    let transformedHeaders = addResponseHeader(upstreamHeaders)

    let encodedTransformedHeaders = Object.keys(transformedHeaders)
      .reduce(encodeHeaders(transformedHeaders), '')

    // flush repsonse to client
    client.write(statusLine)
    client.write(encodedTransformedHeaders)
    client.write('\r\n\r\n')
    client.end(upstreamBody)

    console.log(`sent proxied response to client: \t${client.address}:${client.port}`);
    console.log(`backend connection closed: \t${backend.address}:${backend.port}`);
  });

}

module.exports = {
  forwardToUpstream
}
