// M2M POST route for issuing a pass --> used by automat (demoIssue)

import QRCode from "qrcode";
import type { Route } from "./+types/api.passes";
import { config } from "~/.server/config";
import { createPass } from "~/.server/db";
import { checkAccessToken } from "~/.server/m2m";

const badRequest = (message: string) => Response.json({ error: message }, { status: 400 });

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405, headers: { Allow: "POST" } });
  }

  // verify token and check scope (401/403)
  const denied = await checkAccessToken(request, "create:passes");
  if (denied) return denied;

  // validate body (400)
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest("Request body must be valid JSON");
  }
  const { name, document } = (typeof body === "object" && body !== null ? body : {}) as Record<string, unknown>;
  if (typeof name !== "string" || typeof document !== "string" || !name.trim() || !document.trim()) {
    return badRequest("Both 'name' and 'document' are required and must be non-empty strings");
  }

  // create pass in db
  const pass = await createPass(name.trim(), document.trim());

  // create qr code with link to info page
  const { baseUrl } = config;
  const png = await QRCode.toBuffer(`${baseUrl}/info/${pass.id}`, {
    type: "png",
    width: 400,
    margin: 2,
    errorCorrectionLevel: "M",
  });

  // return location with m2m get endpoint
  return new Response(new Uint8Array(png), {
    status: 201,
    headers: {
      "Content-Type": "image/png",
      Location: `${baseUrl}/passes/${pass.id}`,
    },
  });
}
