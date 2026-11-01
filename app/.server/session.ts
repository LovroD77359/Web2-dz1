// Session/cookie management

import { createCookie } from "react-router";
import { config } from "./config";

/**
 * Two signed, HttpOnly cookies (see lecture 1, "Primjer za Cookie"):
 *  - __session  : who is logged in (only identity data, NOT Auth0 tokens)
 *  - __oidc_tx  : short-lived data of a login "in flight" (state, nonce, PKCE verifier)
 *
 * SameSite=Lax is enough here: Auth0 sends the browser back to /callback with a
 * top-level GET navigation (cookie is sent), while cross-site POSTs (CSRF against
 * /logout or the cancel/delete actions) do NOT carry the cookie.
 */

export type SessionUser = {
  sub: string;
  name: string;
};

export type LoginTransaction = {
  state: string;
  nonce: string;
  codeVerifier: string;
};

// 8h session cookie
const sessionCookie = createCookie("__session", {
    httpOnly: true,
    sameSite: "lax",
    secure: config.secureCookies,
    path: "/",
    maxAge: 60 * 60 * 8,
    secrets: [config.sessionSecret],
  })

// 10min login data cookie
const txCookie = createCookie("__oidc_tx", {
    httpOnly: true,
    sameSite: "lax",
    secure: config.secureCookies,
    path: "/",
    maxAge: 60 * 10,
    secrets: [config.sessionSecret],
  })

// type guard helpers
function isSessionUser(value: unknown): value is SessionUser {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return typeof v.sub === "string" && typeof v.name === "string";
}
function isLoginTransaction(value: unknown): value is LoginTransaction {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.state === "string" &&
    typeof v.nonce === "string" &&
    typeof v.codeVerifier === "string"
  );
}

// getters
export async function getUser(request: Request): Promise<SessionUser | null> {
  const value = await sessionCookie.parse(request.headers.get("Cookie"));
  return isSessionUser(value) ? value : null;
}
export async function getLoginTransaction(request: Request): Promise<LoginTransaction | null> {
  const value = await txCookie.parse(request.headers.get("Cookie"));
  return isLoginTransaction(value) ? value : null;
}

// create/destroy helpers for headers
export const createSessionCookieHeader = (user: SessionUser) => sessionCookie.serialize(user);
export const destroySessionCookieHeader = () => sessionCookie.serialize("", { maxAge: 0 });
export const createTxCookieHeader = (tx: LoginTransaction) => txCookie.serialize(tx);
export const destroyTxCookieHeader = () => txCookie.serialize("", { maxAge: 0 });
