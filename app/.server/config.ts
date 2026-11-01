// Server config from .env variables

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export type Config = ReturnType<typeof loadConfig>;

function loadConfig() {
  const baseUrl = (
    process.env.APP_BASE_URL ??
    process.env.RENDER_EXTERNAL_URL ??
    "http://localhost:5173"
  ).replace(/\/+$/, "");
  const auth0Domain = required("AUTH0_DOMAIN");

  return {
    baseUrl,
    secureCookies: baseUrl.startsWith("https://"),
    sessionSecret: required("SESSION_SECRET"),
    auth0: {
      domain: auth0Domain,
      issuer: `https://${auth0Domain}/`,
      clientId: required("AUTH0_CLIENT_ID"),
      clientSecret: required("AUTH0_CLIENT_SECRET"),
      apiAudience: required("AUTH0_API_AUDIENCE"),
    },
  };
}

export const config = loadConfig();
