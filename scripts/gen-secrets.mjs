import { randomBytes } from "node:crypto";

console.log(`TOKEN_ENC_KEY=${randomBytes(32).toString("base64")}`);
console.log(`SESSION_SECRET=${randomBytes(48).toString("base64")}`);
