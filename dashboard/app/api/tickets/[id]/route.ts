import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const VALID_STATUS = ["NEW", "CONFIRMING", "FIXING", "DONE"];

function safeParse(json: string | null): unknown {
  if (!json) return null;
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      attachments: { orderBy: { createdAt: "asc" } },
      comments: { orderBy: { createdAt: "asc" } },
      project: { select: { id: true, name: true } },
    },
  });
  if (!ticket) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: ticket.id,
    projectId: ticket.projectId,
    project: ticket.project,
    type: ticket.type,
    title: ticket.title,
    description: ticket.description,
    status: ticket.status,
    pageUrl: ticket.pageUrl,
    occurredAt: ticket.occurredAt,
    logs: safeParse(ticket.logs),
    region: safeParse(ticket.region),
    toBe: ticket.toBe,
    createdAt: ticket.createdAt,
    updatedAt: ticket.updatedAt,
    attachments: ticket.attachments,
    comments: ticket.comments,
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const status = typeof body.status === "string" ? body.status : "";
  if (!VALID_STATUS.includes(status)) {
    return NextResponse.json({ error: "invalid status" }, { status: 400 });
  }

  try {
    const updated = await prisma.ticket.update({
      where: { id },
      data: { status },
    });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
}
