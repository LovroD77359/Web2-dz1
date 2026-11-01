// Public pass info page

import { data } from "react-router";
import type { Route } from "./+types/info";
import { getPass } from "~/.server/db";
import { StatusBadge } from "~/components/StatusBadge";

// GET pass info from url
export async function loader({ params }: Route.LoaderArgs) {
  const pass = await getPass(params.id);
  if (!pass) throw data("Pass not found", { status: 404 });
  return { pass };
}

// component showing pass info
export default function Info({ loaderData }: Route.ComponentProps) {
  const { pass } = loaderData;
  return (
    <main className="mx-auto max-w-xl p-6 dark">
      <h1 className="mb-4 text-2xl font-bold">Pass</h1>
      <p className="mb-4">
        <StatusBadge status={pass.status} />
      </p>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
        <dt className="font-semibold">Name</dt>
        <dd>{pass.name}</dd>
        <dt className="font-semibold">Document</dt>
        <dd>{pass.document}</dd>
        <dt className="font-semibold">Issued at</dt>
        <dd>{pass.issuedAt}</dd>
      </dl>
    </main>
  );
}
