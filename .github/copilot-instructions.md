# Futurebook Miền Nam — repository AI instruction

Before editing any UI in this repository, first read `AGENTS.md` (root) and `docs/futurebook-ui-contract.md`, then the scoped `app/AGENTS.md` (Website) or `apps/admin/AGENTS.md` (Admin). These files are normative. Do not infer style from the current chat or from outdated screenshots.

**Mandatory values:** desktop buttons 36px, input/select/dropdown 40px, mobile buttons 44px, control text 13px, radius 8–10px, purple Futurebook accent, lavender-light data table headers, small top-right toast, and create/edit via modal/drawer not inline forms. Use shared CSS tokens/component primitives, not screen-level overrides. Preserve approved tabs, user-custom price lists, true multi-channel selection, SKU strings and confidential NET data. Website promotional red CTA remains an approved exception.

GitHub workflow: branch → PR → CI green → clean review → squash merge, no automatic production deployment; cite contract compliance in PR and include real desktop/mobile screenshots when changing runtime UI.
