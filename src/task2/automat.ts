// Simulated pass-issuing automat (M2M)

import { writeFile } from "node:fs/promises";

// exchange client id and secret for access token
export async function getToken(
  authority: string,
  audience: string,
  clientId: string,
  clientSecret: string,
  scope: string
): Promise<string> {
  const tokenUrl = `${authority}/oauth/token`;

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
      audience,
      scope,
    }),
  });

  if (!response.ok) {
    throw new Error(`Token request failed: ${response.status} ${response.statusText}`);
  }

  const body = (await response.json()) as { access_token?: unknown };
  if (typeof body.access_token !== "string" || body.access_token === "") {
    throw new Error("Token request failed: response does not contain an access_token");
  }
  return body.access_token;
}

// issue pass (using m2m post endpoint) and save qr code png
export async function issuePass(
  url: string,
  token: string,
  name: string,
  document: string
): Promise<void> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name, document }),
  });

  if (response.status !== 201) {
    throw new Error(`Issuing pass failed: ${response.status} ${response.statusText}`);
  }

  // extract pass id from location header
  const location = response.headers.get("Location")!;
  const passId = location.split(/[?#]/)[0].replace(/\/+$/, "").split("/").pop() ?? "";

  const png = Buffer.from(await response.arrayBuffer());
  await writeFile(`${passId}.png`, png);
}
