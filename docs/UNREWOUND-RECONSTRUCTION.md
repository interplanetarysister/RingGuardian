# Ring Guardian Cam — Unrewound reconstruction
Date: 2026-10-21
Source: Remote Betrayal app `6ad7c4efe2e263ca14eb9767`.
Target: Unrewound app `6ad9406e7da53afe29334379`.
Method: Base44 native Make a copy with clone_history=true, after selecting Unrewound's Workspace. No builder AI turns were submitted. Changes were made with sandbox file/shell tools.

The pristine copy was checkpointed as **Exact Remote Betrayal copy before Unrewound enhancements**, checkpoint `6ad940bc1d811dc5e0132950`, git commit `f2d41fb1178f8a431d8b7e917215a283ea418c28`.
Base44's native copy preserved source and chat history; it creates a new app identity. Production data, provider secrets, domain ownership and external authorization are not asserted to have transferred.

Additional source specifications reviewed:
- Unrewound build `6ad7fea1809ca262a1e48497`: initial master implementation command.
- Unrewound build `6ad7fb6d4d4fa1ca2adeef66`: reconstruction prompt, narrated-walkthrough preservation and bulk-action prompt.
- Current instructions: use the exact Remote Betrayal source as the foundation; replace unrelated sample recordings with matched simulated live events.
- Michelle workspace Package P.I. (Copy) `6ad7e252a71f64c4a7e1b867` was moved to Recently deleted at the owner's request. Base44 allows restoration for 30 days; its domain/integrations are disconnected.

## Preserved source parity
All original app routes and backend functions remain: landing, dashboard, packages and details, scanner/device controls, cameras, evidence correlation, cases and details, editable logistics grid/CSV, hands-free preview, Package P.I. review contract, Ring adapter, Amazon adapter, Alexa announcements, guided demonstration and About. Original entity schemas, fixtures, synchronization engine and sample data remain.

## Implemented additions
| Capability | Implementation and status |
|---|---|
| Simulated live events | Five timed scenarios, start/pause/resume/replay/next-event, captions and optional speech. Safe delivery, empty expected porch/wrong-address delivery, wrong-truck placement, later parcel removal, incomplete scan. Explicit synthetic provenance. |
| Matching evidence | Event and clip use one run identifier and capture interval. Save creates real demo records, updates/opens the case, reads the saved event/clip back, and links directly to the saved event. Repeat saves reuse the same clip/event. |
| Recovery and report | Saved cases, recommended physical checks, downloadable evidence JSON, official carrier support links. No real external claim is submitted. |
| Conversational guide | Typed input, optional supported-browser microphone, speech/captions/replay/stop, package context, record lookup, exceptions and navigation, explicit confirmation for case creation. Deterministic local tools, no paid inference. |
| Guided walkthrough | Starts from home, persistent across route changes, ten content steps, focus highlight/dimming, spoken instructions, pause/replay/skip, advancement from actual task events. Exportable Alexa walkthrough content. Browser speech is not claimed to be a deployed Alexa skill. |
| Scan validation | Real record-completeness checks for identity, scan confirmation, vehicle comparison and matched camera reference. Missing manifest data remains unavailable. Expected truck can be configured per package on the device. |
| Monitoring | Worker/device associations, registered camera/scanner totals, animated worker/camera scene. Scripted states are clearly labeled. |
| Hands-free preview | Worker/camera visual, per-object percentages from labeled sample data, slower red/yellow/green sequence. Guide waits for visual sequence completion. |
| Everyday navigation | Common actions first; warehouse tools and connection/help sections expand on demand. |
| Customer/business view | Searchable deliveries, per-package selection, bulk case opening with individual outcomes, export selected records. |
| Alerts/activity/settings | Record-driven review alerts, searchable audit log, per-package local notification preference, role-view preview. Role selector does not confer production authorization. |
| Appearance | Original dark design preserved, optional persistent light palette, readable mobile text, visible focus, touch controls. |
| Evidence reliability | Correlation result above player; timeline markers restricted to selected package; capture clock advances with playback; uploaded media errors are explicit. |

## Validation
- `npm test`: 8 tests passed. Scenarios/package identity, time order, empty-porch mapping, unknown manifest/scan values, wrong-truck checks, premature-save validation, persistence/retry, cross-session scope.
- `npm run lint`: passed.
- `npm run build`: passed.
- Browser: wrong-porch simulation completed, save reported verified, correct saved interval reopened from package link, case findings/audit updated.
- Browser: assistant located package ending 5063 and navigated to its record.
- Browser: validation showed missing manifest as unavailable; page width equaled viewport in inspected preview.
- Full legacy `npm run typecheck` still reports inherited checked-JavaScript component typing errors, especially original authentication/UI components. New scenario tuple arithmetic and missing optional prop issues were corrected. Do not describe full type checking as passed.

## Explicit external and production limitations
Live Ring API/Developer Playground and Amazon Selling Partner authorization have not been verified in this task. Existing adapters are preserved, with a clearly local simulator. Actual Alexa/Alexa+ skill deployment, device voice and web-session pairing require owner/developer setup; exported content alone is not deployment.
Carrier/Gmail/Shopify/TikTok/Temu connections remain planned where no authorized provider exists.
Production organization/role enforcement, secure private surveillance handling, operational notification delivery and retention are not established by the public synthetic demo. Do not place real worker/customer footage or credentials into it.
No new APK was built or verified in this task; existing repository Android infrastructure is preserved separately. No GitHub Actions workflow was triggered.
Original and older Unrewound builds were preserved; the new app above is the enhanced copy.

## References
- Base44 SDK/remote development skills were read and official Base44 skills installed in the sandbox.
- https://developer.amazon.com/en-US/docs/alexa/custom-skills/create-the-interaction-model-for-your-skill.html
- https://developer.amazon.com/en-US/docs/alexa/custom-skills/standard-built-in-intents.html
- https://www.fedex.com/en-us/customer-support/claims.html
- https://www.ups.com/guestclaims/create?loc=en_us
- https://www.usps.com/help/missing-mail.htm