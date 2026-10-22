# Customer complaint submission — Ring Guardian demo

The current specification is [Doorbell delivery-window comparison](./DOORBELL-LOCATION-COMPARISON.md). That file supersedes the previous generic 14-second porch scene documentation.

Current sequence:
1. Select fictional shipment; optionally name it; control its saved demo-only sharing preference.
2. Describe the issue and confirm the delivery window. A customer dispute demo uses an exact two-hour interval.
3. Preview the package-matched eight-second event, or decline footage. If the package did not reach a doorstep, no doorbell event is created.
4. Submit to the internal Ring Guardian demo management queue. When authorized for the **simulation only**, the selected fictional scene and any fictional courier comparison scene are automatically generated and attached to the report; original demo event times, address seeds and tracking reference are preserved.
5. Management replays both scenes side by side, reviews simulated address identifiers, records a qualified comparison status and recovery clues, and saves those to the linked investigation.

The application does not access a real Ring device, nor can registration with Ring Guardian alone give that access. This demo cannot prove absence of a delivery across a two-hour interval; real evidence requires actual authorized source recording and coverage verification.

Use `npm run typecheck`, `npm run build`, `npm run lint`, `npm test` and `node --test scripts/*.test.mjs` for local source validation. None of those commands publish the app.