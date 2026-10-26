from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import os

root = Path(__file__).resolve().parent
prefix = "/" + root.name + "/"
class Handler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/":
            self.send_response(302)
            self.send_header("Location", prefix)
            self.end_headers()
            return
        if not self.path.startswith(prefix):
            self.send_error(404)
            return
        self.path = "/" + self.path[len(prefix):]
        super().do_GET()

host = os.environ.get("PREVIEW_HOST", "127.0.0.1")
port = int(os.environ.get("PREVIEW_PORT", "4173"))
server = ThreadingHTTPServer((host, port), partial(Handler, directory=str(root)))
print(f"Preview: http://{host}:{port}{prefix}", flush=True)
try:
    server.serve_forever()
except KeyboardInterrupt:
    pass
finally:
    server.server_close()
