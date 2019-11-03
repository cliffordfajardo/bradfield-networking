import argparse
from enum import Enum
import select
import socket
import sys
import traceback


CONNECTION_POOL_SIZE = 4

COLOR_GREEN = '\033[32m'
COLOR_BLUE = '\033[34m'
COLOR_RED = '\033[31m'
COLOR_DEFAULT = '\033[0m'


def log(msg, color=COLOR_DEFAULT):
    sys.stderr.write(color + msg + COLOR_DEFAULT + '\n')


def format_data(data):
    """
    Format an HTTP message for presentation in a log message
    """
    string = data.decode().encode('unicode_escape').decode()
    if len(string) > 40:
        return string[:40] + '...'
    return string


class HttpMessage(object):
    """
    A streaming HTTP message parser and encoder.

    Call `ingest_chunk` repeatedly with sequential chunks of the single
    HTTP request. State is updated to reflect headers, body etc that
    we have so far.
    """
    def __init__(self):
        self.request_line = None
        self.headers = {}
        self._body_chunks = []
        self._prior_data = ''

    def ingest_chunk(self, data):
        # If no request line, read it
        if self.request_line is None:
            self.request_line, data = self._read_line(data)
        # If we're already building the body, continue...
        if self._body_chunks:
            self._body_chunks.append(data)
            return
        # ... otherwise, parse headers
        if self._prior_data:
            data = self._prior_data + data
            self._prior_data = ''
        while True:
            header_line, data = self._read_line(data)
            if header_line is None:
                # no more CRLF so wait for next chunk
                self._prior_data = data
                break
            if header_line == b'':
                # end of headers, start building body
                self._body_chunks.append(data)
            else:
                # parse header
                header, value = header_line.split(b': ', 1)
                self.headers[header] = value

    @staticmethod
    def _read_line(data):
        pos = data.find(b'\r\n')
        if pos == -1:
            return None, data
        return data[:pos], data[pos + 2:]

    def get_body(self):
        return b''.join(self._body_chunks)

    def is_complete(self):
        if self._body_chunks and self.request_line[:3] == b'GET':
            return True
        try:
            content_length = int(self.headers[b'Content-Length'])
            actual_length = sum(len(b) for b in self._body_chunks)
            return actual_length >= content_length
        except KeyError:
            return False

    def to_bytes(self):
        return b'\r\n'.join(
             [self.request_line] + [
                 k + b': ' + v
                 for k, v in self.headers.items()
             ] + [b'', self.get_body()]
        )








class ProxyServer(object):

    class ConnectionState(Enum):
        AVAILABLE = 1
        UNAVAILABLE = 2

    class LogAction(Enum):
        RECEIVED = 1
        SENDING = 2

    def __init__(self, host, port, end_host, end_port):
        self.host = host
        self.port = port
        self.end_host = end_host
        self.end_port = end_port
        self.inputs = []  # sockets we'll read from
        self.outputs = []  # sockets we'll write to
        self.messages = {}  # messages we build up to forward
        self.server_connections = {}  # a connection pool to the server
        self.mapping = {}  # sender -> receiver mapping ie where to proxy

    def _start_proxy(self):
        """
        Create a socket to listen for inbound connections from clients
        """
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            s.setblocking(0)
            s.bind((self.host, self.port))
            s.listen()
            log(f'Listening for new connections on {self.host}:{self.port}')
        except OSError as e:
            log(f'Failed to start proxy server: {e}', COLOR_RED)
            s.close()
            sys.exit(-1)
        self.inputs.append(s)
        return s

    def _create_server_connection_pool(self, size):
        """
        Create a number of connections to the end server
        """
        for _ in range(size):
            s = None
            try:
                s = socket.create_connection((self.end_host, self.end_port))
                host, port = s.getpeername()
                log(f'Established a connection to server with fd {s.fileno()}')
                self.server_connections[s] = self.ConnectionState.AVAILABLE
                self.inputs.append(s)
            except OSError as e:
                log(f'Failed to connect to server: {e}', COLOR_RED)
                if s:
                    s.close()
                sys.exit(-1)

    def _close_client_connection(self, s):
        """
        Clean up our state and close the client connection
        """
        if s in self.outputs:
            self.outputs.remove(s)
        if s in self.inputs:
            self.inputs.remove(s)
        dest = self.mapping[s]
        self.server_connections[dest] = self.ConnectionState.AVAILABLE
        s.close()

    def _log(self, action, socket, msg):
        s_host, s_port = socket.getpeername()
        host_port = f'{s_host}:{s_port}'
        if socket in self.server_connections:
            arrow = '<-' if action is self.LogAction.RECEIVED else '->'
            log_msg = '{:<23}(proxy){}{:<21}'.format(' ', arrow, host_port)
        else:
            arrow = '->' if action is self.LogAction.RECEIVED else '<-'
            log_msg = '{:>21}{}(proxy){:<23}'.format(host_port, arrow, ' ')

        if action == self.LogAction.RECEIVED:
            log('{} {} ({} bytes total)'.format(
                log_msg, format_data(msg), len(msg)
            ), COLOR_GREEN)
        elif action == self.LogAction.SENDING:
            log('{} {} ({} bytes total)'.format(
                log_msg,
                format_data(msg),
                len(msg)
            ), COLOR_BLUE)

    def run(self):
        """
        Run the proxy using I/O multiplexing for concurrency
        """
        self._create_server_connection_pool(CONNECTION_POOL_SIZE)
        proxy = self._start_proxy()

        while self.inputs:
            try:
                readable, writable, exceptional = \
                    select.select(self.inputs, self.outputs, self.inputs)

                for s in readable:
                    # if the proxy socket itself is readable, we have a new
                    # connection to accept
                    if s is proxy:
                        client_connection, (c_host, c_port) = proxy.accept()
                        log(f'Accepted a connection from {c_host}:{c_port}')
                        client_connection.setblocking(0)
                        self.inputs.append(client_connection)
                        # TODO handle no available connections
                        dest = [k for k, v in self.server_connections.items()
                                if v is self.ConnectionState.AVAILABLE][0]
                        self.server_connections[dest] = \
                            self.ConnectionState.UNAVAILABLE
                        self.mapping[client_connection] = dest
                        self.mapping[dest] = client_connection
                    else:
                        data = s.recv(4096)
                        # readable socket with data: ingest it for forwarding
                        if data:
                            self._log(self.LogAction.RECEIVED, s, data)
                            dest = self.mapping[s]
                            try:
                                self.messages[dest].ingest_chunk(data)
                            except KeyError:
                                self.messages[dest] = HttpMessage()
                                self.messages[dest].ingest_chunk(data)
                            if dest not in self.outputs:
                                self.outputs.append(dest)
                        # readable socket with no data: close the corresponding
                        # client connection
                        else:
                            if s in self.server_connections:
                                # TODO why would the server ever send this
                                # print(self.mapping)
                                client_connection = self.mapping[s]
                            else:
                                client_connection = s
                            self._close_client_connection(client_connection)

                for s in writable:
                    try:
                        msg = self.messages[s]
                        assert msg.is_complete()
                    except (KeyError, AssertionError):
                        # No messages waiting so stop checking for writability
                        if s in self.outputs:
                            self.outputs.remove(s)
                    else:
                        if s in self.server_connections:
                            msg.headers.update({b'Connection': b'Keep-Alive'})
                        msg_bytes = msg.to_bytes()
                        self._log(self.LogAction.SENDING, s, msg_bytes)
                        s.send(msg_bytes)
                        del self.messages[s]

                for s in exceptional:
                    log(f'Exception on {s}')
                    self.inputs.remove(s)
                    if s in self.outputs:
                        self.outputs.remove(s)
                    dest = self.mapping[s]
                    s.close()

            except socket.error as e:
                print(e, file=sys.stderr)
                traceback.print_exc(file=sys.stderr)
            finally:
                # TODO close anything necessary
                pass



















if __name__ == '__main__':
    parser = argparse.ArgumentParser('python3 advanced_proxy.py')
    parser.add_argument('--host', default='localhost',
                        help='Local interface, default "localhost"')
    parser.add_argument('--port', default='8000',
                        help='Port to listen on, default 8000')
    parser.add_argument('--end_host', default='localhost',
                        help='Hostname of target, default "localhost"')
    parser.add_argument('--end_port', default='9000',
                        help='Port for target, default 9000')
    args = parser.parse_args()
    proxy = ProxyServer(args.host, int(args.port),
                        args.end_host, int(args.end_port))
    proxy.run()
