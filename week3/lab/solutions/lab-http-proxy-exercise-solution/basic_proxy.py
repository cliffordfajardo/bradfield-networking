import argparse
import socket


MAX_INBOUND_MSG_SIZE = 1 << 20  # 1MB


def run_basic_proxy(host, port, end_host, end_port):
    """
    An unrealistically simple request/response style proxy server.

    This will:

        - Accept a single connection at a time
        - Establish a new connection to the target server
        - Read up to 1MB of data from client, and forward it to server
        - Forward data from the client to the server until the client is done
        - Forward a response from the server to the client until it is done

    To test this:

        - Run `python3 server.py`
        - Run `python3 basic_proxy.py`
        - Open up a browser at localhost:8000
        - You should see a response from the end server, containing the JSON form of the request headers.
    """
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        # 
        s.bind((host, port))
        s.listen()
        print(f'Listening for new connections on {host}:{port}')
        

        while True:
            client_connection = None
            server_connection = None
            
            try:
                client_connection, addr = s.accept()
                print('Connection received from', addr)
                server_connection = socket.create_connection((end_host, end_port))
                print(f'Connected to target {end_host}:{end_port}')
                data = client_connection.recv(MAX_INBOUND_MSG_SIZE)
                if data:
                    server_connection.sendall(data)
                    while True:
                        data = server_connection.recv(4096)
                        if data:
                            client_connection.sendall(data)
                        else:
                            break
            finally:
                if client_connection:
                    client_connection.close()
                if server_connection:
                    server_connection.close()





if __name__ == '__main__':
    parser = argparse.ArgumentParser('python3 basic_proxy.py')
    parser.add_argument('--host', default='localhost',
                        help='Local interface, default "localhost"')
    parser.add_argument('--port', default='8000',
                        help='Port to listen on, default 8000')
    parser.add_argument('--end_host', default='localhost',
                        help='Hostname of target, default "localhost"')
    parser.add_argument('--end_port', default='9000',
                        help='Port for target, default 9000')
    args = parser.parse_args()
    run_basic_proxy(args.host, int(args.port),
                    args.end_host, int(args.end_port))




# s.bind creates a connection proxy


# s.createConnection connects to 38



# Real world networking programming idea: 8:38....