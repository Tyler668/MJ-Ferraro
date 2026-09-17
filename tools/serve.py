"""Local preview server. Same as `python -m http.server`, but tells the browser
never to cache, so edits to CSS/JS show up on a plain reload.

    python tools/serve.py [port]
"""
import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, must-revalidate")
        self.send_header("Expires", "0")
        super().end_headers()

    def send_header(self, keyword, value):
        # drop the validator that lets browsers serve a stale copy
        if keyword == "Last-Modified":
            return
        super().send_header(keyword, value)


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8765
    root = str(Path(__file__).resolve().parent.parent)
    handler = partial(NoCacheHandler, directory=root)
    print(f"Serving {root} at http://localhost:{port} (no caching)")
    ThreadingHTTPServer(("127.0.0.1", port), handler).serve_forever()
