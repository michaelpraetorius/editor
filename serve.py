#!/usr/bin/env python3
# Dev-Server mit No-Cache-Headern, damit der Browser Module nie veraltet serviert.
import http.server, socketserver, sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 4599

class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        # Beim HTML-Dokument einmal den (alten) Browser-Cache der Origin leeren,
        # damit veraltete Module sicher verworfen werden.
        p = self.path.split('?')[0]
        if p.endswith('.html') or p.endswith('/'):
            self.send_header('Clear-Site-Data', '"cache"')
        super().end_headers()

socketserver.TCPServer.allow_reuse_address = True
with socketserver.TCPServer(('', PORT), Handler) as httpd:
    print(f'No-cache dev server on http://localhost:{PORT}')
    httpd.serve_forever()
