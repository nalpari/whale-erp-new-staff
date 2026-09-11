#!/usr/bin/env python3
"""직원 앱 목업 로컬 서버.

    python3 docs/mockup/_serve.py [포트]

기본 포트는 8098이다. 관리자 웹 목업(whale-erp-front)이 8099를 쓰므로
둘을 동시에 띄워 놓고 오갈 수 있다.
"""

import http.server
import os
import socketserver
import sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8098
ROOT = os.path.dirname(os.path.abspath(__file__))


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def translate_path(self, path):
        # /flow/... 는 목업 밖(docs/flow)에 있다. 목업에서 링크로 건너갈 수 있게 한다.
        clean = path.split("?")[0].split("#")[0]
        if clean.startswith("/flow/") or clean == "/flow":
            rest = clean[len("/flow"):].lstrip("/")
            return os.path.join(os.path.dirname(ROOT), "flow", *rest.split("/"))
        return super().translate_path(path)

    def end_headers(self):
        # 목업은 고칠 때마다 바로 보여야 한다.
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, fmt, *args):
        if "404" in (fmt % args):
            sys.stderr.write("  없음: %s\n" % (fmt % args))


socketserver.TCPServer.allow_reuse_address = True

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"직원 앱 목업  →  http://localhost:{PORT}/")
    print(f"  루트: {ROOT}")
    print("  멈추려면 Ctrl+C")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n멈췄습니다.")
