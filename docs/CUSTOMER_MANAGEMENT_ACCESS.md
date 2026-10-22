# Customer and management access: implementation status and production gate

## Implemented in GitHub frontend
- Landing selection for **Amazon customer** and **Operations management**.
- Customer report editor with tracking/order number, carrier, delivery issue, address, event date, narrative, video timestamps, selectable local files, and downloadable JSON draft. No carrier transmission, video upload or Ring OAuth is implied.
- Management landing page for registered wearable camera, scanner correlation, footage investigation and evidence. Current data is simulated.

## Required before calling these production logins
1. Configure Base44 authentication and two **server-verified** identities: `customer` and `management`. Never trust a client-side role picker, email domain or localStorage for access. Admin invitation or organization SSO should assign management roles only after organizational approval. Amazon corporate identity/SSO is not connected; do not represent this as Amazon-sponsored access.
2. Partition all database rows and media by tenant. Every API handler must authenticate, enforce role + organization + resource ownership, deny by default, and audit camera/video reads and evidence exports. Existing `User.role` has only `admin` and `user` and must be migrated with backward compatibility.
3. Customer Ring account linking requires actual authorized OAuth/API availability and scoped credentials; no password collection or unauthorized camera scraping. Store tokens encrypted server-side, support disconnect/revoke.
4. Carrier submission requires a supported, authorized carrier integration. Before sending, allow customer to edit the report, preview evidence, select attachments, explicitly approve transmission, and receive a verifiable receipt/status. If no integration is available, export and direct to the carrier's official reporting flow.
5. Wearable-camera enrollment requires device proof, staff/facility assignment and consent/policy controls. Distinguish simulated video from real clips, preserve originals with checksums, retention settings and access logs.
6. Test customer cannot see other customers' cameras, files or cases; management cannot access customer evidence without case-scoped permission; forged management roles fail API authorization; unauthenticated users cannot read operational records; report cannot be marked sent without a carrier confirmation.
7. Verify this GitHub repository has code parity with the canonical Unrewound Base44 app `6ad9406e7da53afe29334379` and publish from Base44 dashboard. This repository was explicitly marked as *not yet parity verified*; do not claim a live deployment on these GitHub commits.

## Demo truthfulness
This is a functional frontend separation and customer draft workflow, **not yet two production authenticated account systems**. The management page currently links into the existing demonstrator console, which must not be exposed to real organizational data without server authorization.
