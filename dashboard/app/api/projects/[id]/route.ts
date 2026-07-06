import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { STATUS_ORDER } from "@/lib/labels";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const project = await prisma.project.findUnique({
    where: { id },
    include: { tickets: { select: { status: true } } },
  });
  if (!project) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const ticketCounts = STATUS_ORDER.reduce(
    (acc, s) => ({ ...acc, [s]: 0 }),
    {} as Record<string, number>
  );
  for (const t of project.tickets) {
    if (t.status in ticketCounts) ticketCounts[t.status] += 1;
  }

  return NextResponse.json({
    id: project.id,
    name: project.name,
    description: project.description,
    projectKey: project.projectKey,
    createdAt: project.createdAt,
    ticketCounts,
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await prisma.project.delete({ where: { id } });
  } catch {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
