import { randomBytes } from "node:crypto";

export function resolveSigningKey(): Uint8Array {
	const jwtSecret = process.env.JWT_SECRET;
	if (!jwtSecret && process.env.NODE_ENV === "production") {
		throw new Error("JWT_SECRET must be configured in production.");
	}
	const signingKey = jwtSecret
		? Buffer.from(jwtSecret, "utf8")
		: randomBytes(32);
	if (signingKey.byteLength < 32) {
		throw new Error("JWT_SECRET must be at least 32 bytes long.");
	}
	return signingKey;
}
