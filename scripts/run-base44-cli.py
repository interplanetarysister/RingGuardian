#!/usr/bin/env python3
"""Launch the verified Remotebetrayal Base44 deployment in a browser via CLI."""
import json, os, sys, webbrowser
from pathlib import Path
from urllib.parse import urlparse
root = Path(__file__).resolve().parents[1]
cfg = json.loads((root / "base44-target.json").read_text())
assert cfg["source"]["workspace"] == "Remotebetrayal"
assert cfg["source"]["app_id"] == "6ad7c4efe2e263ca14eb9767"
url = os.environ.get("BASE44_REMOTE_BETRAYAL_URL") or cfg["source"].get("deployment_url")
if not url or urlparse(url).scheme != "https" or not urlparse(url).netloc:
    sys.exit("BLOCKED: original deployment URL not verified")
print("Opening canonical Remotebetrayal Base44 deployment:", url)
webbrowser.open(url)
