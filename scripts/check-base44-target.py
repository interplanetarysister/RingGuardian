#!/usr/bin/env python3
"""Fail closed unless the original Remotebetrayal Base44 deployment is configured."""
import json
import os
import sys
from pathlib import Path
from urllib.parse import urlparse

root = Path(__file__).resolve().parent.parent
config = json.loads((root / "base44-target.json").read_text())
source = config["source"]
if source.get("workspace") != "Remotebetrayal" or source.get("app_id") != "6ad7c4efe2e263ca14eb9767":
    sys.exit("BLOCKED: the target is not the original Remotebetrayal app")
url = os.environ.get("BASE44_REMOTE_BETRAYAL_URL") or source.get("deployment_url")
if not url:
    sys.exit("BLOCKED: configure the verified Remotebetrayal Base44 published URL")
parsed = urlparse(url)
if parsed.scheme != "https" or not parsed.hostname or parsed.username or parsed.password or parsed.fragment:
    sys.exit("BLOCKED: invalid HTTPS published URL")
if parsed.hostname.lower() not in ("base44.app",) and not parsed.hostname.lower().endswith(".base44.app"):
    sys.exit("BLOCKED: deployment URL host must be under base44.app; custom domains require separate owner verification")
if parsed.path not in ("", "/") or parsed.query:
    sys.exit("BLOCKED: expected the published app origin, not an editor or page URL")
if parsed.hostname.lower() in ("app.base44.app", "base44.app"):
    sys.exit("BLOCKED: builder/editor URL is not the published app")
print(f"Target: {source['workspace']} / {source['app_id']}")
print(f"Published deployment origin: {url}")
print("URL syntax validated; this does NOT independently prove Base44 app ownership or source parity.")
