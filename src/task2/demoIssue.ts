// Demo for automat pass issuing:   npm run issue-pass -- "Pero Perić" HR-123456789
import { getToken, issuePass } from "./automat.ts";

function env(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable ${name}`);
  return value;
}

const [name = "Pero Perić", document = "HR-123456789"] = process.argv.slice(2);

const token = await getToken(
  `https://${env("AUTH0_DOMAIN")}`,
  env("AUTH0_API_AUDIENCE"),
  env("M2M_CLIENT_ID"),
  env("M2M_CLIENT_SECRET"),
  "create:passes"
);

await issuePass(`${env("APP_BASE_URL")}/passes`, token, name, document);
console.log("Pass issued - QR code saved as <pass id>.png in the current directory");
