# Ring Guardian — Amazon Build, Ship, Shape integration verification

Primary hackathon choice: **Ring track**, using the **official Ring Developer Playground**; Alexa+ is an additional conversational integration, not an assertion of partner-gated Alexa+ deployment.

## Ring official Playground (no physical camera, no AWS required)
1. Sign in to https://developer.ring.com and open **Developers Playground**.
2. Generate the official temporary OAuth access token (30-minute lifetime).
3. Put it into the app backend secret `RING_PLAYGROUND_TOKEN` (never into frontend code or this GitHub repository). Alternatively, configure production `RING_CLIENT_ID`, `RING_CLIENT_SECRET`, `RING_REFRESH_TOKEN`.
4. Publish the Base44 app backend. On /ring, press Discover devices. The adapter will report `mode: playground` only when using the official bearer token, and calls `https://api.amazonvision.com/v1/devices`.
5. In the official Playground simulate a **Package** event, and demonstrate it alongside Ring Guardian's **Simulated live events** flow. Select **Create a new simulated package** to persist its tracking record and associated synthetic media. Be explicit: the app's scene reconstruction is not an official Ring video. A full direct mapping of official Playground event payload -> persisted ScanEvent is not yet verified.
6. Record the real Playground request/response and app behavior in the demonstration video. Tokens expire, so redo step 2 just before testing.

## Alexa+ MCP (not an approved Alexa+ partner add-on)
The `base44/functions/alexaMcp/entry.ts` backend function implements JSON-RPC Streamable HTTP, MCP `2025-11-25`, and three tools: `list_demo_packages`, `get_package_status`, `get_package_events`. It reads demo records. Its base URL is the published Base44 function URL, which must be obtained from the deployed app; do not assume a URL.

Use a standards-compatible MCP Inspector/client to issue `initialize`, `tools/list`, and `tools/call` requests. Tool arguments include the browser demo session id. An Alexa+ partner-published add-on is *not* required to enter the hackathon: the Alexa track also accepts a simulated Alexa+ experience, or a self-hosted MCP server. A Flash Briefing skill is separate from Alexa+ Agent Skills/MCP and does not establish Alexa+ compliance by itself.

## Required finish-line evidence
- [ ] Confirm published app actually corresponds to this GitHub revision; its current Base44 source-of-truth may differ.
- [ ] Ring official Playground token available, official device discovery succeeds, and footage/event workflow demonstrated.
- [ ] MCP function publicly reachable with HTTP Streamable JSON-RPC; run initialize/tools/list/tools/call from a real client.
- [ ] Check public endpoint authorization and session isolation before any real customer data is exposed. These sample tools must remain demo-only.
- [ ] Record public video under 3 minutes, demonstrate the integration working, include repo URL and setup/test instructions, and submit by October 23 2026 at noon PDT.
- [ ] Do not call local mock output 'official Ring Playground' or browser speech 'an approved Alexa skill'.
