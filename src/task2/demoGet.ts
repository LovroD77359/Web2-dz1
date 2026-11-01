// Demo for automat pass check after issue:   npm run get-pass -- <pass id> [scope]
import { getToken } from "./automat.ts";

function env(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable ${name}`);
  return value;
}

const [id, scope = "read:passes"] = process.argv.slice(2);
if (!id) throw new Error("Usage: npm run get-pass -- <pass id> [scope]");

const token = await getToken(
  `https://${env("AUTH0_DOMAIN")}`,
  env("AUTH0_API_AUDIENCE"),
  env("M2M_CLIENT_ID"),
  env("M2M_CLIENT_SECRET"),
  scope
);

const response = await fetch(`${env("APP_BASE_URL")}/passes/${id}`, {
  headers: { Authorization: `Bearer ${token}` },
});
console.log(response.status, await response.json());
