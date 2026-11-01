// OIDC (cookie-based) authorization code flow

import * as client from "openid-client";
import { config } from "./config";
import type { LoginTransaction, SessionUser } from "./session";

const callbackUrl = () => `${config.baseUrl}/callback`;

// auth0 endpoints/keys discovery
let discovered: client.Configuration | undefined;
async function getConfiguration() {
  return (discovered ??= await client.discovery(
    new URL(config.auth0.issuer),
    config.auth0.clientId,
    config.auth0.clientSecret,
  ));
}

// redirect to auth0 (frontchannel)
export async function startLogin() {
  const cfg = await getConfiguration();

  const tx: LoginTransaction = {
    state: client.randomState(),
    nonce: client.randomNonce(),
    codeVerifier: client.randomPKCECodeVerifier(),
  };

  const url = client.buildAuthorizationUrl(cfg, {
    redirect_uri: callbackUrl(),
    scope: "openid profile email",
    state: tx.state,
    nonce: tx.nonce,
    code_challenge: await client.calculatePKCECodeChallenge(tx.codeVerifier),
    code_challenge_method: "S256",
  });

  return { authorizationUrl: url.toString(), tx };
}

// after return from auth0; code/token exchange (backchannel) + validation (state, PKCE, id token)
export async function completeLogin(params: URLSearchParams, tx: LoginTransaction): Promise<SessionUser> {
  const cfg = await getConfiguration();

  const tokens = await client.authorizationCodeGrant(cfg, new URL(`${callbackUrl()}?${params}`), {
    pkceCodeVerifier: tx.codeVerifier,
    expectedState: tx.state,
    expectedNonce: tx.nonce,
  });

  const claims = tokens.claims()!;
  return { sub: claims.sub, name: claims.name as string };
}

// helper: builds auth0 single logout url
export function buildLogoutUrl(): string {
  const { auth0, baseUrl } = config;
  const url = new URL(`https://${auth0.domain}/v2/logout`);
  url.searchParams.set("client_id", auth0.clientId);
  url.searchParams.set("returnTo", baseUrl);
  return url.toString();
}
