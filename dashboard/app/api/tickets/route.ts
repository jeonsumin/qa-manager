import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId") || undefined;
  const status = searchParams.get("status") || undefined;
  const type = searchParams.get("type") || undefined;

  const where: Record<string, string> = {};
  if (projectId) where.projectId = projectId;
  if (status) where.status = status;
  if (type) where.type = type;

  const tickets = await prisma.ticket.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { attachments: true, comments: true } },
    },
  });

  const result = tickets.map((t) => ({
    id: t.id,
    projectId: t.projectId,
    type: t.type,
    title: t.title,
    description: t.description,
    status: t.status,
    pageUrl: t.pageUrl,
    occurredAt: t.occurredAt,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
    attachmentCount: t._count.attachments,
    commentCount: t._count.comments,
  }));

  return NextResponse.json(result);
}
