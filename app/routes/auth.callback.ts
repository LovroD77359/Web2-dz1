// Finish login process - after return from Auth0 login

import { redirect } from "react-router";
import type { Route } from "./+types/auth.callback";
import { completeLogin } from "~/.server/oidc";
import {
  createSessionCookieHeader,
  destroyTxCookieHeader,
  getLoginTransaction,
} from "~/.server/session";

export async function loader({ request }: Route.LoaderArgs) {
  const tx = await getLoginTransaction(request);
  if (!tx) {
    return new Response("Login session expired or missing. Go back and try again.", { status: 400 });
  }

  const user = await completeLogin(new URL(request.url).searchParams, tx);

  // update cookies and redirect
  const headers = new Headers();
  headers.append("Set-Cookie", await createSessionCookieHeader(user));
  headers.append("Set-Cookie", await destroyTxCookieHeader());
  return redirect("/", { headers });
}
