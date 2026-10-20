# Roadmap

P0: separate Ring track submission, working Ring Playground/API connection, event provenance, synthetic scanner-feed adapter, timeline, evidence lookup, tests, public judge runbook, sub-three-minute video.

P1: authenticated camera-to-worker assignment, clock-offset confidence, encrypted retention, permission checks and audit logs, CSV logistics export, and approved cross-app evidence-request interface.

P2: optional computer-vision package detector (YOLO), object tracker (ByteTrack), hand proximity plus motion classification (OpenCV), optional visual barcode identification (ZBar), and state machine. STATE_UNCONFIRMED => STATE_HOLDING when object movement/hand proximity is observed => STATE_SCANNED only after a correlated, validated official scan event. Colors red, yellow and green represent these states; unknown visibility and uncertain identity remain unconfirmed. Multiple legitimate handoffs may require distinct scans.

P3: replace physical scanners only after independent accuracy, throughput, privacy, occlusion, barcode readability, light, offline, power, hardware and security validation. No phase-out claim during hackathon.

Ring Guardian and Package P.I. stay in separate GitHub repos and separate Devpost submissions. Integrate through versioned authenticated server-to-server APIs, never cross-database access.
