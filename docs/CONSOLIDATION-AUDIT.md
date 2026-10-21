# Ring Guardian consolidation audit (2026-10-21)

Canonical Base44 project: `6ad9406e7da53afe29334379` (Unrewound).
GitHub: `interplanetarysister/RingGuardian` main; canonical frontend, functions and entity schemas synchronized here.

## Features in canonical app (source verified)
- Original Remotebetrayal UX and source preserved in the Unrewound native clone
- Simulated live porch/dock scenarios, synthetic evidence provenance, video playback and scene event links
- Recovery cases, exportable evidence, carrier reporting guidance
- Package timeline, scan-to-camera correlation, corrective recovery and logistics view
- Scanner/worker monitoring animation, validation, AI tracking preview and per-package statuses
- Guided assistant and on-page task walkthrough; browser speech/microphone where available
- Alexa narration content export, Amazon/Ring adapter surfaces (production connection unverified)
- Alerts, activity history, local notification preferences, business/customer view, bulk cases
- Light/dark preference and responsive navigation

## Unique older-app implementation candidates NOT VERIFIED AS MERGED
Unrewound older app `6ad7fb6d4d4fa1ca2adeef66`:
- WorkerSession, ScannerDevice, EvidenceRequest, RingEvent, AuditLog, CameraDevice, VisionTransition, EvidenceClip, IntegrationCall, VideoRecording, PackageRecord entity models
- evidenceSync and visionStateMachine service, ringWebhook and ringApi, backend scanner ingest and video-retention sweep
- Server-side exportPackageData and bulkActions, external footage request approvals and redacted returns
- 12-step evidence-aware narrated walkthrough and administration policy controls

Unrewound older app `6ad7fea1809ca262a1e48497`:
- PackageStateTransition state engine, scanner buffered flush, recordAuditEntry, verifyEvidenceReadBack
- decideEvidenceRequest, openInvestigation, exportEvidenceCsv, ringWebhook, package sync
- Dedicated scanner connection, spreadsheet export, investigation and evidence request screens

The canonical app's data model and API differ. Copying backend code or schemas unmodified would risk breaking the demo, authorization and evidence provenance. These are functional implementation gaps until ported and tested, not proof of existing compatibility.

## Gates before deleting either older app
1. Backup and reconcile unique backend functions, schemas, and code.
2. Port those features into canonical routes and APIs; test record isolation and permissions.
3. Re-run `npm test`, `npm run lint`, `npm run build`, and browser flows on the canonical application.
4. Verify GitHub file-level parity and publication plus an APK build provenance if requested.
5. Only then archive/delete older Base44 applications. Original Remotebetrayal source is outside the Unrewound deletion scope.

## Source limits
Base44's connected tools exposed read/list/write/checkpoint but rejected shell commands due to Builder-plan access restrictions. No Base44 builder-credit turn was used. This record does not claim live Ring, Alexa, carrier or Amazon production authorizations.