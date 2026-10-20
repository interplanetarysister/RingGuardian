# Architecture and trust boundaries

Data producers: scanner adapter (authoritative scan status when genuinely integrated), camera timeline (visual context), and mock fixture adapter (synthetic only). Core joins on authenticated session, scanner and camera pairing, facility, and time synchronized to UTC. Clock uncertainty is persisted, and ambiguous matches are rejected. Upload timestamps cannot replace acquisition timestamps. Offline buffered video must preserve original capture time.

Evidence storage: durable indexed scan events, immutable clip identifiers, hashes, access audit trail and encrypted media. CSV/Excel is only an export/index, never the evidence vault. Future worker and customer access requires OAuth, scoped authorization, retention and redaction.

Cross-application interface: independent Package P.I. repo calls Guardian evidence request API using server credentials and verified shipment ownership. Guardian responds with request status and review-approved summaries or redacted snippets. No direct shared database, raw unrestricted clip exposure or account impersonation.

The reference Python server uses only fabricated fixtures and localhost; it does not connect to Amazon hubs, Ring, Vega OS, or Package P.I. directly.
