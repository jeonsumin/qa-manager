import { NextRequest } from "next/server";
import fs from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { corsJson, CORS_HEADERS } from "@/lib/cors";

// App Router의 Route Handler는 구 Pages API의 1MB 바디 제한이 없으므로
// html2canvas가 만드는 수 MB data URL을 그대로 받을 수 있다.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_TYPES = ["NETWORK_ERROR", "BUG", "DESIGN", "OTHER"];

// OPTIONS 프리플라이트
export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return corsJson({ error: "invalid JSON body" }, 400);
  }

  const projectKey = typeof body.projectKey === "string" ? body.projectKey : "";
  if (!projectKey) {
    return corsJson({ error: "invalid projectKey" }, 401);
  }

  const project = await prisma.project.findUnique({ where: { projectKey } });
  if (!project) {
    return corsJson({ error: "invalid projectKey" }, 401);
  }

  const type = typeof body.type === "string" ? body.type : "";
  if (!VALID_TYPES.includes(type)) {
    return corsJson({ error: "invalid type" }, 400);
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) {
    return corsJson({ error: "title is required" }, 400);
  }

  const pageUrl = typeof body.pageUrl === "string" ? body.pageUrl : "";
  if (!pageUrl) {
    return corsJson({ error: "pageUrl is required" }, 400);
  }

  const description =
    typeof body.description === "string" ? body.description : "";

  let occurredAt = new Date();
  if (typeof body.occurredAt === "string" && body.occurredAt) {
    const parsed = new Date(body.occurredAt);
    if (!isNaN(parsed.getTime())) occurredAt = parsed;
  }

  const logs =
    body.logs && typeof body.logs === "object"
      ? JSON.stringify(body.logs)
      : null;
  const region =
    body.region && typeof body.region === "object"
      ? JSON.stringify(body.region)
      : null;
  const toBe = typeof body.toBe === "string" ? body.toBe : null;

  const ticket = await prisma.ticket.create({
    data: {
      projectId: project.id,
      type,
      title,
      description,
      pageUrl,
      occurredAt,
      logs,
      region,
      toBe,
    },
  });

  // 스크린샷 data URL 처리
  const screenshot = typeof body.screenshot === "string" ? body.screenshot : "";
  if (screenshot.startsWith("data:")) {
    try {
      const commaIdx = screenshot.indexOf(",");
      const header = commaIdx >= 0 ? screenshot.slice(0, commaIdx) : "";
      const isBase64 = /;base64$/i.test(header);
      const mimeMatch = header.match(/^data:([^;]+)/);
      if (commaIdx >= 0 && isBase64) {
        const mimeType = mimeMatch ? mimeMatch[1] : "image/png";
        const buffer = Buffer.from(screenshot.slice(commaIdx + 1), "base64");
        const attachmentId = (
          await prisma.attachment.create({
            data: {
              ticketId: ticket.id,
              kind: "SCREENSHOT",
              filename: "pending",
              mimeType,
              size: buffer.length,
            },
          })
        ).id;
        const filename = `${attachmentId}.png`;
        const uploadsDir = path.join(process.cwd(), "uploads");
        await fs.mkdir(uploadsDir, { recursive: true });
        await fs.writeFile(path.join(uploadsDir, filename), buffer);
        await prisma.attachment.update({
          where: { id: attachmentId },
          data: { filename },
        });
      }
    } catch (e) {
      // 스크린샷 저장 실패는 티켓 생성 자체를 실패시키지 않는다.
      console.error("screenshot 저장 실패", e);
    }
  }

  return corsJson({ id: ticket.id }, 201);
}
