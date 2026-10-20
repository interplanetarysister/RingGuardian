# Ring Guardian Cam — Amazon Build, Ship, Shape Hackathon

**Independent Ring-track project**; separate from [Package P.I.](https://github.com/interplanetarysister/AmazonHackathon), with a planned secure evidence-request API between applications.

## Product
A proposed first-person wearable camera records worker handling of parcels while existing handheld/wrist scanners remain the authoritative source of successful scans. Authorized scan events are correlated to video using timestamp, worker work session, facility, scanner, and camera IDs. A mock logistics index exports spreadsheet-compatible CSV. Investigators review permitted clips; customers in Package P.I. can request approved, redacted evidence.

**Status:** Concept and simulated proof of concept only. No actual Ring API, Ring Developer Playground, Ring-branded wearable, Amazon internal scanner access, or production deployment is verified. To qualify for the Ring hackathon track, demonstrate *actual documented Ring API/SDK/Playground integration*, not only mocked logistics events.

## Implementation priorities
1. Demonstrate a real Ring Developer Playground event or video session.
2. Connect it to the local synthetic scanner-event adapter with accurate provenance.
3. Retrieve scan-correlated evidence in an investigation interface.
4. Record the running app for a public demo under three minutes.
5. Validate tests, setup, licensing, developer feedback, and Devpost fields by October 23, 2026 noon PDT.

## Future capabilities
Hands-free visual parcel tracking (YOLO, ByteTrack, OpenCV, optional barcode recognition), red/yellow/green object state overlays, reliable multi-object correlation, offline video synchronization, tamper-evident custody evidence, and eventual scanner replacement **only after strict reliability testing and authorized deployment**. Camera barcode recognition cannot itself establish an official scan.

No real customers, worker recordings, credentials or internal logistics records should enter this repository. Amazon and Ring names are trademarks of their respective owners; this is not an official Ring product.
