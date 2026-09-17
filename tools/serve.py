"""Local preview server. Same as `python -m http.server`, but it tells the browser
never to cache (so edits show up on a plain reload) and it listens on the local
network, so a phone or tablet on the same wifi can open the site too.

    python tools/serve.py            # port 8765, reachable on this wifi
    python tools/serve.py 9000       # another port
    python tools/serve.py --local    # this computer only

Windows may need a one-time firewall rule; see the note this prints on startup.
"""
import socket
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

    def log_message(self, fmt, *args):  # quieter: one line per request, no noise
        sys.stderr.write("  %s\n" % (fmt % args))


def lan_ip():
    """This machine's address on the local network (no traffic is actually sent)."""
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("10.255.255.255", 1))
        return s.getsockname()[0]
    except OSError:
        return None
    finally:
        s.close()


if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    local_only = "--local" in sys.argv
    port = int(args[0]) if args else 8765
    root = str(Path(__file__).resolve().parent.parent)
    host = "127.0.0.1" if local_only else "0.0.0.0"

    print(f"Serving {root}  (caching off)")
    print(f"  This computer:  http://localhost:{port}")
    if not local_only:
        ip = lan_ip()
        if ip:
            print(f"  Same wifi:      http://{ip}:{port}   <- open this on a phone or tablet")
            print("\n  If the phone can't reach it, Windows Firewall is blocking Python.")
            print("  In an *admin* PowerShell, run this once:")
            print('    New-NetFirewallRule -DisplayName "Peg site preview" -Direction Inbound '
                  f'-Protocol TCP -LocalPort {port} -Profile Private -Action Allow')
        else:
            print("  Same wifi:      (no network address found)")
    print("\nCtrl+C to stop.\n")

    ThreadingHTTPServer((host, port), partial(NoCacheHandler, directory=root)).serve_forever()
