import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  // public pages
  index("routes/home.tsx"),
  route("info/:id", "routes/info.tsx"),

  // login/logout api routes
  route("login", "routes/auth.login.ts"),
  route("callback", "routes/auth.callback.ts"),
  route("logout", "routes/auth.logout.ts"),

  // m2m api routes
  route("passes", "routes/api.passes.ts"),
  route("passes/:id", "routes/api.pass.ts"),
] satisfies RouteConfig;
