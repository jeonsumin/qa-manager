import TicketListClient from "./TicketListClient";

export default async function ProjectTicketsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ status?: string; type?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  return (
    <TicketListClient
      projectId={id}
      status={sp.status ?? ""}
      type={sp.type ?? ""}
    />
  );
}
