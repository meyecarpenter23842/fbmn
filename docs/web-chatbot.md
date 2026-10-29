# WEB chatbot launcher — Futurebook Miền Nam

Status: **visual demo, Dialogflow CX not connected**.

- Fixed circular 56px desktop / 52px mobile launcher at bottom right with the owner-supplied FBMN square logo, resized to optimized 128px WebP.
- The chat panel appears **only after a click**, never automatically, and closes via the X button, launcher or Escape.
- On a visitor message or quick-action, render a three-dot typing indicator for 850–1600ms, then show a curated local reply.
- The demo only links to already existing website routes; no prices, stock, business policies, or AI-generated claims. Input and transcript are kept only in this React component state, not persisted or sent to the server.
- For real Dialogflow CX, replace the **local reply adapter** with a server-side gateway that owns credentials, session lifecycle, rate limiting, abuse protection and privacy/retention rules. Never ship Google service-account credentials in the client.
- The existing app-download invitation is raised above the launcher (86px bottom) to avoid blocking it before opening chat.
- Accessibility: button labels, aria-expanded, nonmodal dialog, live chat log, input label, focus restoration, Escape, reduced-motion support.
- Release through CI and preview first; **do not auto deploy production**.
