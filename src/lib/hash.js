import crypto from "crypto";
import { canonicalJSONStringify } from "./canonical_json.js";

export function sha256hexBytes(buf) {
  return crypto.createHash("sha256").update(buf).digest("hex");
}

export function sha256hexCanonical(obj) {
  return sha256hexBytes(Buffer.from(canonicalJSONStringify(obj), "utf8"));
}

export function sha256hex(str) {
  return sha256hexBytes(Buffer.from(str, "utf8"));
}
