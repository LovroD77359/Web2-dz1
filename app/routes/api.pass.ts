// M2M GET route for a pass with given id --> returned in issue Location, used by demoGet

import type { Route } from "./+types/api.pass";
import { getPass } from "~/.server/db";
import { checkAccessToken } from "~/.server/m2m";

export async function loader({ request, params }: Route.LoaderArgs) {
  const denied = await checkAccessToken(request, "read:passes");
  if (denied) return denied;

  const pass = await getPass(params.id);
  if (!pass) return Response.json({ error: "Pass not found" }, { status: 404 });

  return Response.json(pass);
}
