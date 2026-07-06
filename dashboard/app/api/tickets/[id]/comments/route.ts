import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(
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

  const author = typeof body.author === "string" ? body.author.trim() : "";
  const commentBody = typeof body.body === "string" ? body.body.trim() : "";
  if (!author) {
    return NextResponse.json({ error: "author is required" }, { status: 400 });
  }
  if (!commentBody) {
    return NextResponse.json({ error: "body is required" }, { status: 400 });
  }

  const ticket = await prisma.ticket.findUnique({ where: { id } });
  if (!ticket) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const comment = await prisma.comment.create({
    data: { ticketId: id, author, body: commentBody },
  });

  return NextResponse.json(comment, { status: 201 });
}
