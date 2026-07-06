import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateProjectKey } from "@/lib/keys";

export const dynamic = "force-dynamic";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const projectKey = generateProjectKey();
  try {
    const updated = await prisma.project.update({
      where: { id },
      data: { projectKey },
    });
    return NextResponse.json({ projectKey: updated.projectKey });
  } catch {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
}
