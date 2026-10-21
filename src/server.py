"""Local-only synthetic scanner and evidence demo; not a Ring API integration."""
from http.server import BaseHTTPRequestHandler, HTTPServer
import json
from pathlib import Path
from urllib.parse import urlparse
from .core import Session,Scan,Segment,match,export_csv,EvidenceRequest
SESSION=Session("DEMO-SESSION","CAM-027","SCANNER-027","SIM-HUB")
SCANS=[Scan("SCAN-1","SIM-1001","SCANNER-027","DEMO-SESSION","SIM-HUB","2026-10-20T10:00:00Z","received"),Scan("SCAN-2","SIM-1002","SCANNER-027","DEMO-SESSION","SIM-HUB","2026-10-20T10:02:00Z","sorted")]
CLIPS=[Segment("CLIP-1","CAM-027","DEMO-SESSION","2026-10-20T09:59:45Z","2026-10-20T10:00:35Z"),Segment("CLIP-2","CAM-027","DEMO-SESSION","2026-10-20T10:01:45Z","2026-10-20T10:02:35Z")]
FIXTURE_PATH = Path(__file__).resolve().parent.parent / "fixtures" / "synthetic-evidence.json"
def fixture_events():
    data = json.loads(FIXTURE_PATH.read_text(encoding="utf-8"))
    if data.get("source") != "synthetic_not_amazon" or data.get("mode") != "simulation":
        raise ValueError("Expected synthetic fixture provenance")
    return data

def result():
    return [{"package":s.package_id,"event":s.event_type,"scan_at":s.scanned_at,"evidence":match(s,SESSION,CLIPS),"source":"synthetic_not_amazon_or_ring"} for s in SCANS]
PAGE="""<!doctype html><html lang="en"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Ring Guardian Simulation</title><style>body{font:16px system-ui;background:#0e1725;color:#eee;max-width:850px;margin:auto;padding:25px}button{padding:12px;margin:5px;border-radius:8px}pre{white-space:pre-wrap;overflow-wrap:anywhere}</style><h1>Ring Guardian — Scanner-to-Footage Concept</h1><p>Only synthetic data. This is not a real Ring integration.</p><button onclick="load()">Run example scans</button><button onclick="fixture()">View simulated camera events</button><button onclick="location.href='/export.csv'">Export spreadsheet CSV</button><button onclick="request()">Request evidence</button><pre id="out"></pre><script>async function load(){document.getElementById('out').textContent=JSON.stringify(await (await fetch('/events')).json(),null,2)}async function fixture(){document.getElementById('out').textContent=JSON.stringify(await (await fetch('/simulated-camera-events')).json(),null,2)}async function request(){document.getElementById('out').textContent=JSON.stringify(await (await fetch('/request')).json(),null,2)}</script></html>"""
class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        p=urlparse(self.path).path
        if p=="/":body=PAGE.encode();ct="text/html"
        elif p=="/events":body=json.dumps(result()).encode();ct="application/json"
        elif p=="/simulated-camera-events":body=json.dumps(fixture_events()).encode();ct="application/json"
        elif p=="/request":body=json.dumps(EvidenceRequest("SIM-REQ","SIM-1001",True).public_view()).encode();ct="application/json"
        elif p=="/export.csv":body=export_csv(SCANS,{s.id:match(s,SESSION,CLIPS) for s in SCANS}).encode();ct="text/csv"
        else:self.send_error(404);return
        self.send_response(200);self.send_header("Content-Type",ct);self.send_header("Content-Length",str(len(body)));self.end_headers();self.wfile.write(body)
if __name__=="__main__":
    print("Synthetic demo only: http://127.0.0.1:8765")
    HTTPServer(("127.0.0.1",8765),Handler).serve_forever()
