// Logout POST

import { redirect } from "react-router";
import { buildLogoutUrl } from "~/.server/oidc";
import { destroySessionCookieHeader } from "~/.server/session";

export async function action() {
  return redirect(buildLogoutUrl(), {
    headers: { "Set-Cookie": await destroySessionCookieHeader() },
  });
}

export function loader() {
  return redirect("/");
}
