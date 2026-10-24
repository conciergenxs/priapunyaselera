"""Local preview server for the PPS site.

    python3 scripts/serve.py [port]      (default 8000; serves the project root)

Like `python3 -m http.server`, but every response carries `Cache-Control:
no-cache`, so the browser re-checks each file before reusing it. Without it,
browsers may keep running an old copy of a JS module (modules imported by other
modules are not refreshed by a normal reload), which leaves pages like the
article list empty after the code changes.
"""
import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-cache")
        super().end_headers()


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    handler = partial(NoCacheHandler, directory=str(ROOT))
    with ThreadingHTTPServer(("127.0.0.1", port), handler) as server:
        print(f"Serving {ROOT} at http://127.0.0.1:{port}/")
        server.serve_forever()


if __name__ == "__main__":
    main()
