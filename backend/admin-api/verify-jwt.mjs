import { jwtVerify } from "jose";

// Neon Managed Better Auth JWT profile (not arbitrary OAuth/OIDC tokens).
// The official Neon Functions verification contract checks the signature
// against the branch-scoped JWKS, the Auth host issuer and expiry. It does
// NOT require the branch Auth URL to be present as an "aud" claim.
// https://neon.com/docs/compute/functions/authentication
export async function verifyManagedNeonJwt(token, jwks, issuer) {
  const { payload } = await jwtVerify(token, jwks, {
    issuer,
    algorithms: ["EdDSA", "ES256", "RS256"],
    maxTokenAge: "15 minutes",
  });
  if (typeof payload.exp !== "number" || typeof payload.iat !== "number") {
    throw new Error("Missing JWT lifetime");
  }
  // Managed Neon Auth uses the immutable UUID as subject; no roles from JWT.
  if (typeof payload.sub !== "string" ||
      !/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(payload.sub)) {
    throw new Error("Invalid Managed Auth subject");
  }
  return payload.sub;
}
