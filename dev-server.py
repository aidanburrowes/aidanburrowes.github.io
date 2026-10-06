import http.server, socketserver, sys, os
class H(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()
    def log_message(self, *a): pass
os.chdir(sys.argv[2])
socketserver.TCPServer.allow_reuse_address = True
with socketserver.TCPServer(("", int(sys.argv[1])), H) as s: s.serve_forever()
