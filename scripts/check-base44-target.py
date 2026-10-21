#!/usr/bin/env python3
"""Verify canonical Ring Guardian source configuration before CLI or APK work."""
import json
import os
import sys
from pathlib import Path
from urllib.parse import urlparse

root = Path(__file__).resolve().parent.parent
target = json.loads((root / "base44-target.json").read_text())
source = target["source"]
assert source["workspace"] == "Remotebetrayal"
assert source["app_id"] == "6ad7c4efe2e263ca14eb9767"
url = os.environ.get("BASE44_REMOTE_BETRAYAL_URL") or source.get("deployment_url")
if not url or urlparse(url).scheme != "https" or not urlparse(url).netloc:
    sys.exit("BLOCKED: Remotebetrayal Base44 deployment URL is not verified. Do not launch prototype or build an APK as if it were the original app.")
print(f"Target: {source['workspace']} / {source['app_id']}")
print(f"Deployment: {url}")
print("URL supplied, but source ownership and app-version parity must still be verified before claiming APK equivalence.")
