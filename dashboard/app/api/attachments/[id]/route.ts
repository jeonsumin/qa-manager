import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const attachment = await prisma.attachment.findUnique({ where: { id } });
  if (!attachment) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const filePath = path.join(process.cwd(), "uploads", attachment.filename);
  let data: Buffer;
  try {
    data = await fs.readFile(filePath);
  } catch {
    return NextResponse.json({ error: "file missing" }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(data), {
    status: 200,
    headers: {
      "Content-Type": attachment.mimeType || "application/octet-stream",
      "Content-Length": String(data.length),
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
