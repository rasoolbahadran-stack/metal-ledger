import { randomInt } from "node:crypto";

export function makeDocumentNumber(prefix: "TR" | "PY" | "DL") {
  const date = new Date();
  const stamp = [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("");
  return `${prefix}-${stamp}-${randomInt(100000, 999999)}`;
}
