# Doorbell delivery-window comparison — fictional demo

## Customer recording rules

The expected doorway is keyed by a normalized fictional delivery address, not by a randomly generated clip key. The same sample home retains its facade, number, door color, mat, landscaping, window and entry fixtures for the delivery, any subsequent removal, and any replay. Later scenes may have different lighting because they represent a different time. Two separate parcels addressed to the same fictional house use the same facade.

The customer-side renderer uses a fixed 16:9 doorbell-height camera, textured facade and a moving fictional courier. This is a browser canvas animation (2.5D) and **not** photorealistic footage, an MP4, an actual Ring video or a verified recording.

- **Completed drop-off (8 seconds):** the sample courier enters with the carton, bends, puts it on the mat, leaves the camera frame by second six, and the delivered box remains during the final two seconds.
- **Any activity in the expected doorway:** The accelerated fictional 2-hour recording now shows all of its generated motion activities, not only package-like movement (pedestrians, a dog walker, bird flight, cycling). Distinct source-event timestamps and short source intervals are retained with the report. They are deliberately slowed/held on the eight-second playback timeline, so motion remains legible; it is a nonuniform illustrative compression, not continuous real-time proof.
- **No parcel in the expected doorway (8 seconds):** compress a specifically selected *fictional two-hour delivery window* into eight playback seconds, including accelerating the clock and lighting. No parcel appears. The simulated recording is a dramatization, not a real two-hour continuous source. This is only one lead and **cannot prove** absence of a delivery; a real fast-forward or sampled clip needs actual continuous source footage, coverage/gap verification, and raw originals.
- **Later package removal (8 seconds):** shows the *same doorway* as the earlier successful delivery with altered lighting and a distinct, unidentified fictional visitor. Never infer identity or intent.
- **Never delivered to a doorstep / hub exception:** no doorbell image is invented. The customer can still submit a discrepancy without one.

## Comparing claimed versus expected delivery location

The `delivered_but_missing` scenario links two **distinct fictional perspectives**:

1. **Customer expected doorway:** a fixed address-specific eight-second dramatization of a two-hour interval in which the parcel does not arrive.
2. **Couriers' alleged drop-off doorway:** a separate eight-second fictional courier arrival, parcel set-down and exit at a deliberately different sample entrance. Its origin is invented and **not authenticated Ring/courier evidence**.

Both clips, original source-window timestamps, tracking identifier, package dimensions, address rendering identity and provenance are stored with the internal report. In the management Customer Reports inbox, `DoorwayReview` displays both playable scenes side by side and a location-clue table (number, front-door color, doormat, facade, fixture, window). A manager selects `not_determined`, `possible_location_mismatch`, `appears_to_match` or `needs_more_evidence`, checks relevant visible clues, and enters up to 2,000 characters of notes. Saving records observations on `CustomerComplaint` and updates the same demo session's linked `Investigation.findings`, with an audit activity. Never interpret mismatch based only on synthetic visuals as proof of misdelivery or theft.

## Demo enrollment / permission

Demo shipments are fictional pre-enrolled customers with a pre-enabled **simulated** camera-sharing preference. The customer can disable or re-enable it. The server persists the setting on that demo shipment and rejects synthetic video attachment if disabled. Report submission automatically generates, attaches, and forwards the appropriate fictional clips into the same browser demo session's management queue; there is no separate file-upload step.

**No real Ring API, camera recording, provider sharing or unattended transfer occurs.** The app does **not** have permission to read a real Ring camera just because someone registers for Ring Guardian. Production needs a functioning and permitted provider integration, explicit separately documented customer/provider authorization, camera/device ownership verification, narrowly scoped event or delivery-window selection, a sharing and revocation control, recording/retention/deletion policies, securely stored source footage and timestamps, preservation of original media, capture-gap analysis, signed short-lived evidence access and tenant-separated reviewer roles. A 2-hour video accelerated into an 8-second file is around 900× speed; eight sampled seconds alone cannot verify the entire window. The user must know exactly what data is shared with whom and when.

## Manual demo steps

1. Open Customer and select **Marked delivered, recipient reports missing**. Review the pre-enabled fictional sharing preference and optional nickname.
2. Set an **exactly two-hour** delivery window. Select **Not received** or **Wrong address**. Proceed to evidence.
3. Play the eight-second expected-doorway time-lapse and distinct courier-claimed drop-off scene. Compare the mat, house number, color and fixtures. Confirm review and submit the investigation.
4. In Management (same demo session), refresh **Customer reports & received doorbell evidence**. Open the matching report, play the pair, select **Possible drop-off address mismatch**, mark clues and enter recovery notes. Save; verify the linked case reflects the assessment.
5. Return to Customer, choose the **Delivered correctly, then removed from the porch** scenario. Switch between its two recorded events: check the same doorway and different event times.
6. Turn off fictional sharing. Confirm a new report includes no video and the server rejects attempts to attach evidence while sharing is disabled.
7. Choose **wrong delivery truck** or **missing hub scan** and verify no doorstep recording is invented.

Run `npm run typecheck`, `npm run build`, `npm run lint`, `npm test`, and `node --test scripts/*.test.mjs`. The automated tests use an in-memory server harness; successful tests do not establish a published deployment, a real browser's video appearance, or a real Ring integration.

## Release gates

This change edits Base44 source, entities and functions, **not** the published runtime until an authorized deployment of the app and its schema/functions is performed. Cross-account customer-to-management permission separation, real device capture, sample-to-original media verification, production consent and retention, and Ring API permissions remain incomplete.

## Required real-Ring recording behavior (NOT CONNECTED)
The future authorized Ring camera integration must preserve **all motion during the configured 2-hour delivery window**, even when not identified as a courier or a package. Ring motion/doorbell events are inputs, not a delivery-only filter. Preserve each provider event ID, source timestamp, capture start/end, subject category if supplied, camera ID, source provenance, and event-specific media reference. Never drop events simply because they are a pet, pedestrian, visitor, animal, vehicle, weather motion, or unclassified movement. Detect coverage gaps and expired/missing clips explicitly; retain original evidence separately from any generated 8-second summary. Obtain customer/provider consent, use authorized API, and ensure management access is scoped. If capture is event-triggered rather than continuous, do not claim the recording covers a continuous 2-hour interval.