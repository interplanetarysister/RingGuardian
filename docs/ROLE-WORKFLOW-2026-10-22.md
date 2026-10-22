# Ring Guardian — streamlined role-based guided workflows

## UI principle
The Customer and Management experiences use sequential, visibly numbered stages with **5px high-contrast outlines**. Only active and already-unlocked form areas are usable. Future panels show colored titles and blurred, noninteractive field placeholders until the required preceding stage is complete. Active panels have stronger shadows; earlier panels can be reopened to review. The fifth stage is optional and uses violet, while the Customer optional-carrier route can be opened independently without filing an Amazon complaint.

| Number | Stage color | Customer | Management |
| --- | --- | --- | --- |
| 1 | Sunshine yellow (#FACC15) | Select Package | Review Customer Reports |
| 2 | Firetruck orange-red (#FF5138) | Compile Details | Follow Shipment |
| 3 | Turquoise teal (#09CFC2) | Gather Evidence | Match Camera Evidence |
| 4 | Grass green (#45C967) | Submit Investigation | Review Investigation |
| 5 | Electric violet (#AD70FF) | Optional Other Carriers and Reports | More Management Tools |

### Customer workflow
1. Select a fictional shipment from demo-linked Amazon/shipping sources. Optionally name it. The demo displays explicit **DEMO LINKED** status for Amazon, Gmail, Ring, UPS, FedEx, USPS, DHL, and OnTrac. No real OAuth grant, password, or Ring account is implied.
2. Choose issue type and explain the concern, with an editable **simulated** reported delivery window derived from available demo event timestamps.
3. Playback the selected shipment's **event-matched synthetic Ring-style 14-second scene** directly in the page. The scene is associated with the selected demo tracking record and a specific supported event type (delivery, disputed window, or later removal); packages still in transit or missing a hub scan have no attributed doorstep recording. A sample with no attributed doorstep event cannot attach a fabricated camera clip. Explicitly opt in to attachment and acknowledge its limited observation window, or choose no video.
4. Preview and submit the complaint/evidence to the **internal fictional Management queue only**. Inspect its receipt. No outside provider or authority receives a report.
5. Optional independent non-Amazon route: use simulated linked carrier and Gmail fixtures, paste/import shipping messages, or prepare a personally supplied video and Word complaint. Download ZIP, Word, or video files for customer-directed carrier filing. Never claim an external claim was filed.

### Management workflow
1. Inspect customer complaints and synthetic video receipts.
2. Open the dashboard or package history and return; progress persists in sessionStorage during cross-page navigation.
3. Open both scanner station and evidence views to compare simulated record identity, timestamp, and camera interval.
4. Open investigations and review the audit trail. Neither tour nor mere navigation performs a recovery or resolution.
5. Optional exploratory operations and extended demo tools.

### Walkthrough and speech
The Customer guide is Amy; the Management guide is Piper. The 4 Customer and 5 Management spoken scripts were resynthesized from the new stage instructions using local Piper Amy TTS assets, and their SHA256 manifest was regenerated. The default playback speed remains 1.3×. Both guides can explain the section colors, labels, stage gates, and limitations; basic commands for skipping, repeat, pause, resume, and text mode are unchanged.

### Deployment boundaries
- The UI and narration are checked as Base44 **source**, not as a verified published site.
- The Cloudflare Workers AI prompt changes are in source and need independent Worker deployment and version verification.
- A demo linked label denotes fixtures **only**, not proof of working real integrations.
- External claims/police filings, real camera footage, live customer account authorization, and APK packaging require additional production integrations/testing.
- Stage progression receipts record only allowlisted demo interactions, not real package handling or account credentials.

### Source validation
Use `npm run typecheck && npm run lint && npm run build && node --test scripts/*.test.mjs`. Inspect mobile widths, keyboard/focus behavior, voice replay, and return navigation manually on real devices before publication.