# CEO-UI01 — CEO workspaces, visual and mobile layout (11/11/2026)

Scope: Flutter CEO UI only. No email integration, no POST to existing Owner inbox,
no API/Neon/Worker migration, no changes to Website/Admin or authenticated Owner permissions.

## Screens
- Overview: real first-page counts, responsive metric grid, recent requests and conversations.
- Conversations: search loaded session IDs and their latest-message preview (not full history), clearly labeled session IDs rather than invented
  customer names, customer/assistant reading bubbles and a bounded desktop detail panel.
- Outsourcing: searchable, status-filtered existing requests, summaries and grouped detail.
- Contact: same searchable/filterable inbox, without implementing email until CEO-MAIL01.
- Common: one set of panel/list/search/status/metric/chat primitives and CEO purple/lavender
  tokens; 5 existing navigation destinations; unchanged bell + viewed receipts; mobile
  selected-only nav label at narrow widths, ellipsis/wrapping, bounded detail sheets.

## Data and behavior boundaries
- Filtering is local to loaded pages; the UI says so. Load more remains enabled.
- A 'Mới' status is *unhandled*; a 'Chưa xem' label means not yet marked viewed.
- Opening a request still sends the existing DL12E read receipt; errors do not fake success.
- The chat module is read-only and shows only the first 25 turns returned by the API.
- The disabled DL12B statistics screen must not display sample figures.
- No customer PII is persisted in the frontend or analytics.

## Checks
Run Flutter analyze/test/build via existing DL12A CEO CI workflow and check at
360/390/1280/1440px, including long text, filter/search, overlays, keyboard,
read receipt regression and reduced motion. UI test is not proof of live-device UAT.
Release gate: CI green, Codex review clean, squash PR in development repo; synchronize
main only after approvals, deployment separately authorized by Owner.
