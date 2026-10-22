# Ring Guardian Alexa skill integration (demo)

This folder contains an English-language custom-skill interaction model and a Node.js ASK SDK Lambda handler. The content demonstrates fictional package evidence. It does **not** connect to a user's real Ring account, Amazon delivery records, or a hypothetical employee camera.

## Current deliverables
- Import `interaction-model/en-US.json` into the Alexa developer console's **custom skill** interaction model. Invocation name is "ring guardian demo".
- Package `lambda.mjs`, `skillLogic.mjs` and dependencies declared in `package.json` for an Alexa-hosted Node runtime or AWS Lambda Node.js 22, with handler `lambda.handler`.
- Register the Lambda endpoint in the skill console, build the model, and test the phrases "start the walkthrough", "next step", "previous step", "repeat this step", "start over", and "stop".
- Do **not** publish until the official skill invocation and endpoint validation pass and privacy details are completed.

## Alexa account linking for live operation
For any real customer shipment or management role information, add OAuth 2.0 authorization-code account linking, validate scoped access tokens on the service backend, and enforce server-side tenant/role and shipment authorization. Never rely on spoken role selection to grant permissions. Keep public sample walkthrough unauthenticated and contain no actual customer information.

## Pending blockers
Amazon developer-console access, endpoint provisioning, Alexa skill ID, verified account-linking authorization service, management identity verification, and verified Base44 source sync are not available to this workflow. Skill and Lambda have not been submitted, installed on an Echo, or approved by Amazon. Do not imply an official Amazon/Ring hardware partnership.

The on-page voice demonstration uses the browser speech synthesis API; it is independent of this Alexa custom skill.
