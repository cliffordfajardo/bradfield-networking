# Format of HTTP Request


# Format of an HTTP Request
An HTTP request contains a series of lines that each end with a carriage return and a line feed,
represented as either `<CR><LF>` or `\r\n`

The first line of a request (the message line ) contains the HTTP method and target.
For example, a message line for a GET request contains the keyword GET and a string that
represents the object that is to be fetched, as shown in the following example:

```
GET /localhost:8000/index.html HTTP/1.1\r\n
```

The rest of the request contains HTTP headers, including a required Host header and, if applicable, a message body.
The request ends with a "blank line" (`<CR><LF>` or `\r\n`).

```
GET /mysite/index.html HTTP/1.1\r\n
Host: 10.101.101.10\r\n
Accept: */*\r\n
\r\n
```






# Format of an HTTP Response
An HTTP response contains a status message, response HTTP headers, and the requested object or,
if the requested object cannot be served, an error message.

```
HTTP/1.1 200 OK\r\n
Content-Length: 55\r\n
Content-Type: text/html\r\n
Last-Modified: Wed, 12 Aug 1998 15:03:50 GMT\r\n
Accept-Ranges: bytes\r\n
ETag: '04f97692cbd1:377'\r\n
Date: Thu, 19 Jun 2008 19:29:07 GMT\r\n
\r\n
<55-character response body>
```




# resources
- https://www.slideshare.net/fukamachi/writing-a-fast-http-parser
- https://docs.citrix.com/en-us/netscaler/12/appexpert/http-callout/http-request-response-notes-format.html#format-of-an-http-response