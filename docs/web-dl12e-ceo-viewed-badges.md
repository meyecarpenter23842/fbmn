# DL12E — CEO red badges for truly unread requests

**Owner UAT 11/11/2026:** opening a contact or outsourcing request must clear its red badge without falsely marking it handled. The original badge counted all `status=new`, even after viewing.

- `fbmn_catalog_private.ceo_request_reads` stores one durable read receipt by Owner subject, kind and UUID. No customer contact details or messages. The existing CEO push database role has only SELECT/INSERT/DELETE on this table.
- GET of Owner inbox goes through existing protected Cloudflare Worker; CEO gateway appends `viewedAt` from the private receipt table. POST /api/ceo/reads has Owner JWT, same-Origin and bounded UUID verification, inserts idempotent receipt only for an existing request.
- Bell/Gia công/Liên hệ badges count requests that remain `status=new && viewedAt=null` across loaded pages, and hide at zero. Opening detail submits the read receipt; only server success removes the badge. `Mới / chưa xử lý` remains until Admin processes it.
- Cross-device and refresh persist receipts for the same Owner. Failed requests never produce fake read success; no new chat unread feature, no change to Worker, forms, marketing or Web Push permission.
- **Release gate:** Owner-approved Neon backup and staging rehearsal → production migration SQL `20261111_dl12e_ceo_request_reads.up.sql` → CEO gateway/Flutter deploy. Do not deploy new CEO app before migration, since unread badge queries fail closed if receipt storage is unavailable.
- Receipts older than 90 days are cleaned on successful read-recording operations.
