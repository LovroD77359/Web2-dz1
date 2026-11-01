// Small ACTIVE/CANCELLED badge component

export function StatusBadge({ status }: { status: "ACTIVE" | "CANCELLED" }) {
  return <span className={`
    inline-block rounded px-2 py-0.5 text-sm font-semibold
    ${status === "ACTIVE" ? "bg-green-900 text-green-100" : "bg-red-900 text-red-100"}
  `}>
    {status}
  </span>;
}
