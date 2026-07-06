// SQLite(prisma/dev.db) → MySQL 데이터 이관 스크립트.
//
// 사용법: (dashboard/ 에서) docker compose up -d 로 MySQL healthy 확인 후
//   node scripts/migrate-sqlite-to-mysql.mjs
//
// - id / 타임스탬프를 원본 그대로 보존한다 (uploads/ 파일명이 attachment id 기반).
// - SQLite는 Prisma DateTime을 ms epoch 정수로 저장하므로 Date 로 변환해 넣는다.
// - node:sqlite 내장 모듈(Node 22+)로 원본을 읽고, @prisma/client(MySQL)로 insert.
// - 재실행 안전성을 위해 대상 테이블을 먼저 비운다.

import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SQLITE_PATH = path.join(__dirname, "..", "prisma", "dev.db");

// SQLite에 저장된 값(ms epoch 정수 또는 문자열)을 Date로 변환.
function toDate(v) {
  if (v === null || v === undefined) return null;
  if (typeof v === "number" || typeof v === "bigint") return new Date(Number(v));
  // 혹시 문자열(ISO)로 저장된 경우 대비
  const n = Number(v);
  if (!Number.isNaN(n) && String(v).trim() !== "") return new Date(n);
  return new Date(v);
}

const prisma = new PrismaClient();
const sqlite = new DatabaseSync(SQLITE_PATH, { readOnly: true });

function readAll(table) {
  return sqlite.prepare(`SELECT * FROM ${table}`).all();
}

async function main() {
  const projects = readAll("Project");
  const tickets = readAll("Ticket");
  const attachments = readAll("Attachment");
  const comments = readAll("Comment");

  console.log("[원본] Project=%d Ticket=%d Attachment=%d Comment=%d",
    projects.length, tickets.length, attachments.length, comments.length);

  // 대상 비우기 (FK 순서 역순). 재실행 안전.
  await prisma.comment.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.project.deleteMany();

  for (const p of projects) {
    await prisma.project.create({
      data: {
        id: p.id,
        name: p.name,
        description: p.description ?? null,
        projectKey: p.projectKey,
        createdAt: toDate(p.createdAt),
      },
    });
  }

  for (const t of tickets) {
    await prisma.ticket.create({
      data: {
        id: t.id,
        projectId: t.projectId,
        type: t.type,
        title: t.title,
        description: t.description ?? "",
        status: t.status,
        pageUrl: t.pageUrl,
        occurredAt: toDate(t.occurredAt),
        logs: t.logs ?? null,
        region: t.region ?? null,
        toBe: t.toBe ?? null,
        createdAt: toDate(t.createdAt),
        updatedAt: toDate(t.updatedAt),
      },
    });
  }

  for (const a of attachments) {
    await prisma.attachment.create({
      data: {
        id: a.id,
        ticketId: a.ticketId,
        kind: a.kind,
        filename: a.filename,
        mimeType: a.mimeType,
        size: a.size,
        createdAt: toDate(a.createdAt),
      },
    });
  }

  for (const c of comments) {
    await prisma.comment.create({
      data: {
        id: c.id,
        ticketId: c.ticketId,
        author: c.author,
        body: c.body,
        createdAt: toDate(c.createdAt),
      },
    });
  }

  // 건수 검증 (원본 = 대상)
  const dst = {
    Project: await prisma.project.count(),
    Ticket: await prisma.ticket.count(),
    Attachment: await prisma.attachment.count(),
    Comment: await prisma.comment.count(),
  };
  const src = {
    Project: projects.length,
    Ticket: tickets.length,
    Attachment: attachments.length,
    Comment: comments.length,
  };

  console.log("\n[검증] 테이블별 건수 (원본 → 대상)");
  let ok = true;
  for (const table of Object.keys(src)) {
    const match = src[table] === dst[table];
    if (!match) ok = false;
    console.log("  %s: %d → %d  %s", table, src[table], dst[table], match ? "OK" : "MISMATCH");
  }

  // id 보존 확인
  const migratedProjects = await prisma.project.findMany({ select: { id: true, name: true } });
  console.log("\n[검증] Project id 보존:", migratedProjects.map((p) => `${p.id}(${p.name})`).join(", "));

  if (!ok) {
    console.error("\n건수 불일치 — 이관 실패");
    process.exitCode = 1;
  } else {
    console.log("\n이관 완료: 모든 테이블 건수 일치, id 보존됨.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    sqlite.close();
    await prisma.$disconnect();
  });
