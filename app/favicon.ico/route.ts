// Preserve legacy /favicon.ico requests but serve the same reviewed FBMN mark.
export function GET(request: Request) {
  return Response.redirect(new URL("/brand/fbmn-mark.svg?v=20261104", request.url), 307);
}
