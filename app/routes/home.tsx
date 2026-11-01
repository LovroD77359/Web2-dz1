// Public home page

import { Form, data } from "react-router";
import type { Route } from "./+types/home";
import { cancelPass, deletePass, getStats, getPasses } from "~/.server/db";
import { getUser } from "~/.server/session";
import { StatusBadge } from "~/components/StatusBadge";

// GET pass counts and (if user is logged in) list of passes
export async function loader({ request }: Route.LoaderArgs) {
  const [user, stats] = await Promise.all([getUser(request), getStats()]);
  const passes = user ? await getPasses() : null;
  return { user, stats, passes };
}

// POST for cancelling/deleting a pass
export async function action({ request }: Route.ActionArgs) {
  if (!(await getUser(request))) throw data("You must be logged in", { status: 401 });

  const form = await request.formData();
  const id = String(form.get("id"));
  const intent = form.get("intent");
  if (intent === "cancel") await cancelPass(id);
  else if (intent === "delete") await deletePass(id);
  return null;
}

// home page component
export default function Home({ loaderData }: Route.ComponentProps) {
  const { user, stats, passes } = loaderData;

  // html elements for table of passes
  const passElements = passes ? passes.map((pass) => (
    <tr key={pass.id} className="border-b border-white">
      <td className="py-2 pr-4">{pass.name}</td>
      <td className="py-2 pr-4">{pass.document}</td>
      <td className="py-2 pr-4 whitespace-nowrap">{pass.issuedAt}</td>
      <td className="py-2 pr-4">
        <StatusBadge status={pass.status} />
      </td>
      <td className="py-2">
        <div className="flex gap-2">
          <Form method="post">
            <input type="hidden" name="id" value={pass.id} />
            <button type="submit" name="intent" value="cancel" disabled={pass.status === "CANCELLED"}
              className="btn disabled:opacity-40 hover:bg-gray-800"
            >
              Cancel
            </button>
          </Form>
          <Form method="post" onSubmit={(e) => {
              if (!confirm("Delete this pass permanently?")) e.preventDefault();
            }}
          >
            <input type="hidden" name="id" value={pass.id} />
            <button type="submit" name="intent" value="delete"
              className="btn border-red-400 text-red-300 hover:bg-red-950"
            >
              Delete
            </button>
          </Form>
        </div>
      </td>
    </tr>
  )) : null

  return (
    <main className="mx-auto max-w-4xl p-6 dark">
      {/* header showing login/logout form (button) */}
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Digital passes</h1>
        {user ? (
          <div className="flex items-center gap-3">
            <span>{user.name}</span>
            <Form method="post" action="/logout" reloadDocument>
              <button type="submit" className="rounded border px-3 py-1 hover:bg-gray-800 hover:cursor-pointer">
                Log out
              </button>
            </Form>
          </div>
        ) : (
          <a href="/login" className="rounded bg-blue-600 px-3 py-1 text-white hover:bg-blue-700 hover:cursor-pointer">
            Log in
          </a>
        )}
      </header>

      {/* section showing aggregated data about all passes */}
      <section className="mb-8 grid grid-cols-2 gap-4">
        <div className="rounded border border-white p-4">
          <div className="text-sm text-gray-500">Total passes</div>
          <div className="text-3xl text-white font-bold">{stats.total}</div>
        </div>
        <div className="rounded border border-white p-4">
          <div className="text-sm text-gray-500">Active passes</div>
          <div className="text-3xl text-white font-bold">{stats.active}</div>
        </div>
      </section>

      {passes && (
        // section showing table of passes with cancel/delete buttons
        <section>
          <h2 className="mb-3 text-xl font-semibold">Passes</h2>
          {passes.length === 0 ? (
            <p className="text-gray-500">No passes have been issued yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b-2 border-white">
                    <th className="py-2 pr-4">Name</th>
                    <th className="py-2 pr-4">Document</th>
                    <th className="py-2 pr-4">Issued at</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {passElements}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </main>
  );
}
