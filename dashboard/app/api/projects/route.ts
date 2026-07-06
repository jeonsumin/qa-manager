import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateProjectKey } from "@/lib/keys";
import { STATUS_ORDER } from "@/lib/labels";

export const dynamic = "force-dynamic";

function emptyCounts() {
  return STATUS_ORDER.reduce(
    (acc, s) => ({ ...acc, [s]: 0 }),
    {} as Record<string, number>
  );
}

export async function GET() {
  const projects = await prisma.project.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      tickets: { select: { status: true } },
    },
  });

  const result = projects.map((p) => {
    const ticketCounts = emptyCounts();
    for (const t of p.tickets) {
      if (t.status in ticketCounts) ticketCounts[t.status] += 1;
    }
    return {
      id: p.id,
      name: p.name,
      description: p.description,
      projectKey: p.projectKey,
      createdAt: p.createdAt,
      ticketCounts,
    };
  });

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  const description =
    typeof body.description === "string" ? body.description : null;

  const project = await prisma.project.create({
    data: {
      name,
      description,
      projectKey: generateProjectKey(),
    },
  });

  return NextResponse.json(
    {
      id: project.id,
      name: project.name,
      description: project.description,
      projectKey: project.projectKey,
      createdAt: project.createdAt,
      ticketCounts: emptyCounts(),
    },
    { status: 201 }
  );
}
