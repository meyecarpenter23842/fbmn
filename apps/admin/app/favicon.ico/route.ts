// Browsers request /favicon.ico even when a modern icon is advertised.
// Redirect to the shared FBMN symbol, not the long wordmark.
export function GET(request: Request) {
  return Response.redirect(new URL("/brand/fbmn-mark.svg?v=20261104", request.url), 307);
}
