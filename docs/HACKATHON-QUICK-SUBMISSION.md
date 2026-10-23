# Ring Guardian — Minimum eligible submission plan (October 22, 2026)

**Primary track chosen for this repository: Alexa+ (simulated experience alternative).**
This is a project entry plan, **not** proof that Devpost has accepted an entry.
**Deadline: October 23, 2026, 12:00 PM PDT.**

Official rules: https://amazonappdev2026.devpost.com/rules
Official FAQ: https://amazonappdev2026.devpost.com/details/faqs
Official final update: https://amazonappdev2026.devpost.com/updates/46539-final-stretch

## Why this route

The rules explicitly allow an Alexa+ simulated experience built using AI or agentic
tools in lieu of registering a live Alexa+ skill or deploying an MCP server. This
alternative **does not need the restricted preview Alexa+ SDK**, a linked Echo, or
official Alexa+ device authentication. The code and video must demonstrate a
*working*, interactive experience, not an image or a static script.

Ring Guardian's /alexa screen now includes a simulated assistant built with:
- `src/components/alexa/AlexaSimulatedExperience.jsx`: text dialogue, optional
  browser narration, linked tool responses, and navigable package cards.
- `src/lib/alexaSimulation.mjs`: actual tool execution over the session's
  fictional shipment records, producing the correct status, last recorded
  location, package count, and selected profile route.
- `src/lib/conversationalGuide.js` and `src/lib/assistantTools.js`:
  the tool-routed contextual guide with Cloudflare Workers AI / Meta Llama
  optional natural-language responses and a data-preserving fallback.
- `src/pages/Packages.jsx` and `src/pages/PackageDetail.jsx`:
  navigable result cards and package profile with custody history and evidence.

This app does **not** claim that a developer-owned Ring app is approved,
a camera is paired, Alexa account linking is live, or a Cloudflare MCP endpoint
is verified. The Ring simulator-looking fictional clips are not Amazon's Ring
Developer Playground and are **not** qualifying proof for the Ring track.

## Zero-credit source validation

Use Node 22 (22.12+). From the repository root:

```bash
npm ci
npm run typecheck
npm run lint
npm test
npm run build
```

`npm ci` downloads packages from npm but does not consume AWS, Kiro, Base44,
or GitHub Actions minutes when executed locally. For pure logic checks:

```bash
node --test scripts/alexa-simulation.test.mjs scripts/package-profile.test.mjs
```

A repository push or a passing local build alone **does not publish** the Base44
web application. Publish from the linked Base44 dashboard and then test the
public URL. Base44 site publishing and actual runtime behavior must be verified
independently; avoid presenting unverified unpublished code as a live demo.

## Manual runtime test — record only if each step works

1. Open the published application and choose the console/management view.
2. Open the **Alexa** page at `/alexa`. The simulation must visibly load
   fictional shipments. Use an incognito/unauthenticated browser to confirm
   a first-time viewer can reach it without a paid account.
3. Select **Show all packages**. Observe the package-data tool and
   actual clickable package results.
4. Ask **Where is package 5063?**. Inspect the recorded fictional status,
   last recorded location, and click **Open package profile**.
5. Show the matching package profile, scan timeline and synthetic evidence.
6. Navigate back to the Alexa experience. Ask **How do I report a missing
   delivery?**. Observe a contextual response and use its referenced link.
7. Optional: enable browser narration; record only if audible.
8. If the AI endpoint is unavailable, the built-in tool guide must still
   answer package questions; disclose any AI limitation accurately.

Any failed step is an unresolved release blocker, not a completed check.

## Video requirements — remaining human action

- Record a **real screen recording** of the functioning published app, not a
  generated video or code screenshots.
- Keep the finished video **under three minutes** and upload it **publicly**
  to YouTube or Vimeo; include the public URL in the Devpost submission.
- Clearly say **“simulated Alexa+ experience, not a connected Alexa device.”**
- Show the assistant executing a tool and opening the actual corresponding
  package record. Show demo data/voice provenance clearly.
- Avoid any suggestion that synthetic Ring footage was captured by Ring
  hardware or that real carrier data was accessed.
- Include project name, problem, features, repo URL, and tech in the write-up.

## Entry checklist

- [ ] Published app works end to end in an actual browser.
- [ ] Build, lint, typecheck, and tests pass. Preserve evidence of results.
- [x] Source includes a true interactive simulation and its source code.
- [x] Repository has a public open-source license (see LICENSE).
- [ ] Public repo's license is visible on GitHub and testing instructions work.
- [ ] Under-three-minute public YouTube/Vimeo functional demo recorded and linked.
- [ ] Devpost project description, Built With, primary Alexa+ track, source URL,
      eligibility information and every required form field completed.
- [ ] Product feedback provided for **each** tool/API/SDK used, including
      what it did, onboarding, what worked, what did not, and whether to reuse.
- [ ] Entry submitted **before noon PDT October 23, 2026**.
- [ ] Keep the repo, app, and recording accessible during the judging period.
      Freeze submitted materials after the deadline per the organizers.

## Separate paths — not currently proven

- **Ring:** would require executing an Amazon-documented Ring API, SDK,
  simulator, or actual device in the recorded runtime. Synthetic recreation,
  integration scaffolding, and camera-like graphics alone are insufficient.
- **Alexa+ MCP:** a valid live Streamable HTTP deployment and protocol
  interoperability still require an actual endpoint verification. Do not use
  the existence of `base44/functions/alexaMcp` as proof of deployment.
- **Fire TV:** no demonstrated Fire OS/Vega OS runtime and simulator proof.
- **Bee:** no real Bee device or supported Apple Watch Bee data shown.
- **AWS Builder:** do not claim AWS qualification on an unverified integration.
- **Open Source:** must supply a separate qualifying open-source project or
  contribution alongside the primary entry with the required URL and details.

The fastest safe fallback for eligibility is the **Alexa+ simulation** only
after actual app/video verification and Devpost submission.
