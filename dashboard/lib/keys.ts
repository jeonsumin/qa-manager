import crypto from "crypto";

// 연동용 프로젝트 키: "qa_" + 32자 hex
export function generateProjectKey(): string {
  return "qa_" + crypto.randomBytes(16).toString("hex");
}
