# Ring Guardian tour and media alignment
Updated October 22, 2026

## Contract for every guided scenario
- Show a package identifier on-screen before narration begins, and include the same identifier in the corresponding spoken event.
- The active simulation video scene and event timeline must come from the same `LIVE_SCENARIOS` record. Do not use a previous scenario's narration after the visitor changes the selection.
- Stop narration whenever the video pauses, the scenario changes, the tour closes or the user leaves the page.
- When an error blocks a guided action, show a conspicuous alert naming the action and package, and offer a button to hear that same failure aloud.
- Never label generated scenes as real Ring recordings or synthetic announcements as a real Echo or Alexa voice.
- The management tour can show handling scans, warehouses and employee cameras; customer tours must not expose management's demo console or private business records.
- The visitor's first action is always to add or import a package. Live-mode import remains a local preview until account-backed data storage and scoped authorization are implemented.
- Live mode must neither seed new demo data nor permit demo operations. Existing fictional records remain isolated; switching to live does not delete records.

## Integration disclosures
Gmail/email reading, delivery carrier accounts, Ring account/cameras, and company logistics integrations are not connected simply by rendering an onboarding control. An account must consent via a verified OAuth or another supported authorization flow before any data is read. No guest input is transferred to an external provider without an explicit authorized workflow.

## Review only where necessary
Compile a production build after source changes. Execute a media/voice walkthrough when the demo is being recorded or if the scenario or narration source is changed. Do not run unrelated service tests solely to claim a checkmark.