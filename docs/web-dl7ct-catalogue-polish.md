# DL7C-T — Catalogue polish
Scope: docs/roadmap.md. Preserve DL7A/DL7B/DL7C-S, shared G05 backdrop, no visitor sound controls.
Audio: [Turning a page](https://commons.wikimedia.org/wiki/File:Turning_a_page.ogg), planish, recorded 5 July 2007, public domain. Fixed Wikimedia original Ogg URL, decoded after interaction, trimmed/faded; network/codec failure stays silent. Verify actual sound and cross-browser playback before release. Admin preview shares player and draft volume.
Migration adds sound_volume (0–100, default 35) to existing settings and public view; keeps existing speed/on/off/shadow and revisions. Apply migration before Workers, then frontends. Rollback frontends and Workers before down migration.
Acceptance: CI, Codex review, actual 1440/1280/768/390/360 screenshots, drag/swipe/rapid navigation, keyboard, fullscreen, zoom, PDF, sound on/off/volume and preview, reduced motion. No production acceptance claimed.
