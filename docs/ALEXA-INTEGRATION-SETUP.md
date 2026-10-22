# Ring Guardian Alexa setup — 2026-10-21

Canonical Base44 application: `6ad9406e7da53afe29334379` (Unrewound).

## Public Flash Briefing endpoint
`https://ring-guardian-alexa-feed.interplanetary-fund.workers.dev/flash-briefing.json`

Cloudflare account: `c95db4f2c901f32776471b85f1eda15d`
Worker: `ring-guardian-alexa-feed`
Cloudflare API shows deployment at 100% and workers.dev enabled. External DNS/HTTP availability could not be confirmed from this environment; test URL in a normal browser before entering in Amazon.

Feed fields: uid, updateDate, titleText, mainText, redirectionUrl (JSON); one public fictional, non-sensitive briefing. Fixed introduction published October 21, 2026. A Flash Briefing will not answer questions or control the Ring Guardian app and the static introductory feed will become stale after seven days unless updated with legitimately new content.

In Alexa Developer Console for a **Flash Briefing** skill: choose feed type Text, format JSON, name Ring Guardian Package Evidence, preamble 'From Ring Guardian', content update frequency 'weekly' (or less frequently, matching actual editorial changes), genre Technology and paste the URL above.

## Alexa+ MCP add-on — NOT deployed
The separate interactive Alexa+ MCP Toolkit integration is **not** the Flash Briefing endpoint. Amazon requires an HTTPS Streamable HTTP MCP server, OAuth 2.1 PKCE S256 with discovery endpoints, authenticated bearer access, account linking, and an add-on configuration. Do not paste the Flash Briefing feed into the Alexa+ MCP endpoint field.

Needed next: deploy an authenticated Ring Guardian MCP service that retrieves only user-authorized records, implements data-minimized tools (package_status, evidence_summary, initiate_guided_tour, walkthrough_next), enforces role scoping and approved media access; verify OAuth metadata, tool latency and developer onboarding. Alexa+ CLI onboarding `alexa-ai configure` and `alexa-ai deploy` requires access to the authorized Amazon developer account.

Official references:
- https://www.developer.amazon.com/docs/alexaplus/add-ons/mcp-toolkit-quickstart
- https://developer.amazon.com/en-US/docs/alexa/flashbriefing/flash-briefing-skill-api-feed-reference.html
