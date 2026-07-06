import { statusLabel, typeLabel } from "@/lib/labels";

const STATUS_STYLE: Record<string, string> = {
  NEW: "bg-blue-100 text-blue-700",
  CONFIRMING: "bg-amber-100 text-amber-700",
  FIXING: "bg-purple-100 text-purple-700",
  DONE: "bg-green-100 text-green-700",
};

const TYPE_STYLE: Record<string, string> = {
  NETWORK_ERROR: "bg-red-100 text-red-700",
  BUG: "bg-orange-100 text-orange-700",
  DESIGN: "bg-pink-100 text-pink-700",
  OTHER: "bg-gray-100 text-gray-700",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${
        STATUS_STYLE[status] ?? "bg-gray-100 text-gray-700"
      }`}
    >
      {statusLabel(status)}
    </span>
  );
}

export function TypeBadge({ type }: { type: string }) {
  return (
    <span
      className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${
        TYPE_STYLE[type] ?? "bg-gray-100 text-gray-700"
      }`}
    >
      {typeLabel(type)}
    </span>
  );
}
