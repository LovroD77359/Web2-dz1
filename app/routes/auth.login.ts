// Start login process - redirect browser to Auth0

import { redirect } from "react-router";
import { startLogin } from "~/.server/oidc";
import { createTxCookieHeader } from "~/.server/session";

export async function loader() {
  const { authorizationUrl, tx } = await startLogin();
  return redirect(authorizationUrl, {
    headers: { "Set-Cookie": await createTxCookieHeader(tx) },
  });
}
