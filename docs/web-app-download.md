# WEB app download — owner-supplied URLs pending

- Header desktop/mobile shows a Tải app button. It opens the same compact dismissible panel used for the on-entry invitation.
- A fresh browser shows the invitation once after a brief delay. Next **automatic** appearance is at least 2 hours after the last display; closing/refreshing/revisiting cannot reset that cooldown.
- Cooldown is stored locally in `localStorage` under `fbmn:app-download:last-shown:v1`; no server request, personal tracking, cookies or analytics.
- An open tab schedules the following automatic invitation and checks on tab visibility changes. A manual tap in the menu may always open the panel (and also resets the automatic cooldown).
- No store links are published yet. iOS/Android display "Link đang cập nhật" instead of a clickable fake listing.
- Once official app listings exist, populate `lib/app-download/config.ts` with confirmed HTTPS Apple App Store / Google Play destinations, then review + CI + deploy.
- Official brand glyphs: Simple Icons, https://github.com/simple-icons/simple-icons/blob/develop/icons/apple.svg and /android.svg. Their owners retain trademark rights.
