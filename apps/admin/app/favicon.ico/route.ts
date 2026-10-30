// Browsers request /favicon.ico even when a modern icon is advertised.
// Serve the exact same audited company WebP rather than a made-up icon.
export function GET(request: Request) {
  return Response.redirect(new URL("/brand/fbmn-official-logo.webp", request.url), 307);
}
