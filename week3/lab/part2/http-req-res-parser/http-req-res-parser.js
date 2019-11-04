/**
 * A HTTP request or response parser. It takes a correctly formatted string representing an HTTP request or response
 * and returns a JSON representation of it. 
 * Use cases: you're writing your own tcp server from scratch and you need to grab the values from the request string.
 * @param {*} string A valid HTTP string.
 * @returns {Object}
 */
function http_req_res_parser(string) {
  
}









const example_requests = [
  [
    'GET / HTTP/1.1\r\n',
    'Host: localhost:9001\r\n',
    'User-Agent: curl/7.64.1\r\n',
    'Accept: */*\r\n',
    '\r\n'
  ],
  [
    'GET /about.html HTTP/1.1\r\n',
    'Host: localhost:9001',
    'Accept: */*\r\n',
    '\r\n'
  ]
]
const example_responses

module.exports = http_req_res_parser;