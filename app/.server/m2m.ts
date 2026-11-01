// M2M token verification and scope check

import { createRemoteJWKSet, errors, jwtVerify } from "jose";
import { config } from "./config";

let jwks: ReturnType<typeof createRemoteJWKSet> | undefined;
const getJwks = () => (jwks ??= createRemoteJWKSet(new URL(`${config.auth0.issuer}.well-known/jwks.json`)));

export async function checkAccessToken(request: Request, requiredScope: string): Promise<Response | null> {
  const header = request.headers.get("Authorization");
  const match = header?.match(/^Bearer\s+(\S+)$/i);
  if (!match) return Response.json({ error: "unauthorized" }, { status: 401, headers: { "WWW-Authenticate": "Bearer" } });

  const { auth0 } = config;

  let payload;
  try {
    ({ payload } = await jwtVerify(match[1], getJwks(), {
      issuer: auth0.issuer,
      audience: auth0.apiAudience,
      algorithms: ["RS256"],
    }));
  } catch (err) {
    // token verification (bad signature, expired, malformed...)
    if (err instanceof errors.JOSEError && !(err instanceof errors.JWKSTimeout)) {
      return Response.json({ error: "unauthorized" }, { status: 401, headers: { "WWW-Authenticate": "Bearer" } });
    }
    throw err;
  }

  // scope check
  const scopes = typeof payload.scope === "string" ? payload.scope.split(" ") : [];
  if (!scopes.includes(requiredScope)) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  return null;
}
