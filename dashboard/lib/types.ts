export interface TicketCounts {
  NEW: number;
  CONFIRMING: number;
  FIXING: number;
  DONE: number;
}

export interface ProjectSummary {
  id: string;
  name: string;
  description: string | null;
  projectKey: string;
  createdAt: string;
  ticketCounts: TicketCounts;
}

export interface TicketListItem {
  id: string;
  projectId: string;
  type: string;
  title: string;
  description: string;
  status: string;
  pageUrl: string;
  occurredAt: string;
  createdAt: string;
  updatedAt: string;
  attachmentCount: number;
  commentCount: number;
}

export interface Attachment {
  id: string;
  ticketId: string;
  kind: string;
  filename: string;
  mimeType: string;
  size: number;
  createdAt: string;
}

export interface Comment {
  id: string;
  ticketId: string;
  author: string;
  body: string;
  createdAt: string;
}

export interface ConsoleErrorLog {
  ts?: string;
  message: string;
  stack?: string;
}

export interface NetworkErrorLog {
  ts?: string;
  method?: string;
  url?: string;
  status?: number;
  statusText?: string;
  error?: string;
}

export interface TicketLogs {
  consoleErrors?: ConsoleErrorLog[];
  networkErrors?: NetworkErrorLog[];
}

export interface Region {
  x: number;
  y: number;
  width: number;
  height: number;
  viewportWidth: number;
  viewportHeight: number;
}

export interface TicketDetail {
  id: string;
  projectId: string;
  project: { id: string; name: string };
  type: string;
  title: string;
  description: string;
  status: string;
  pageUrl: string;
  occurredAt: string;
  logs: TicketLogs | null;
  region: Region | null;
  toBe: string | null;
  createdAt: string;
  updatedAt: string;
  attachments: Attachment[];
  comments: Comment[];
}
