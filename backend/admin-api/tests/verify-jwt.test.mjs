import test from "node:test";
import assert from "node:assert/strict";
import { generateKeyPair, exportJWK, createLocalJWKSet, SignJWT } from "jose";
import { verifyManagedNeonJwt } from "../verify-jwt.mjs";

const ISSUER = "https://neon-auth.example.test";
const USER = "123e4567-e89b-42d3-a456-426614174000"; // fictitious schema-shaped UUID
async function fixture() {
  const { publicKey, privateKey } = await generateKeyPair("EdDSA");
  const jwks = createLocalJWKSet({ keys: [await exportJWK(publicKey)] });
  const sign = ({ issuer=ISSUER, exp="15m", sub=USER, aud }={}) => {
    let jwt = new SignJWT({ sub, role: "authenticated" })
      .setProtectedHeader({ alg: "EdDSA" })
      .setIssuedAt().setIssuer(issuer).setExpirationTime(exp);
    if (aud !== undefined) jwt = jwt.setAudience(aud);
    return jwt.sign(privateKey);
  };
  return { jwks, sign };
}
test("Managed Neon JWT without an aud claim verifies by branch key, issuer and expiry",async()=>{
  const f=await fixture();
  const token=await f.sign();
  assert.equal(await verifyManagedNeonJwt(token,f.jwks,ISSUER),USER);
});
test("Invalid issuer, signature, expired JWT and non-UUID subject fail closed",async()=>{
  const f=await fixture();
  await assert.rejects(verifyManagedNeonJwt(await f.sign({issuer:"https://other.test"}),f.jwks,ISSUER));
  await assert.rejects(verifyManagedNeonJwt(await f.sign({exp:"-1h"}),f.jwks,ISSUER));
  await assert.rejects(verifyManagedNeonJwt(await f.sign({sub:"viewer"}),f.jwks,ISSUER));
  const untrusted=await fixture();
  await assert.rejects(verifyManagedNeonJwt(await untrusted.sign(),f.jwks,ISSUER));
});
