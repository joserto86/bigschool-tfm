import { randomBytes, scrypt, scryptSync, timingSafeEqual } from "node:crypto";

const PASSWORD_KEY_LENGTH = 64;
const PASSWORD_SALT_LENGTH = 16;
const DUMMY_PASSWORD_HASH = `scrypt$${Buffer.alloc(PASSWORD_SALT_LENGTH).toString("base64url")}$${Buffer.alloc(PASSWORD_KEY_LENGTH).toString("base64url")}`;

function deriveKey(password: string, salt: Buffer): Promise<Buffer> {
	return new Promise((resolve, reject) => {
		scrypt(password, salt, PASSWORD_KEY_LENGTH, (error, derivedKey) => {
			if (error) {
				reject(error);
				return;
			}
			resolve(derivedKey);
		});
	});
}

export async function hashPassword(password: string): Promise<string> {
	const salt = randomBytes(PASSWORD_SALT_LENGTH);
	const key = await deriveKey(password, salt);
	return `scrypt$${salt.toString("base64url")}$${key.toString("base64url")}`;
}

export function hashPasswordSync(password: string): string {
	const salt = randomBytes(PASSWORD_SALT_LENGTH);
	const key = scryptSync(password, salt, PASSWORD_KEY_LENGTH);
	return `scrypt$${salt.toString("base64url")}$${key.toString("base64url")}`;
}

export async function verifyPassword(
	password: string,
	passwordHash: string,
): Promise<boolean> {
	const [algorithm, encodedSalt, encodedKey, ...extraParts] =
		passwordHash.split("$");
	if (
		algorithm !== "scrypt" ||
		!encodedSalt ||
		!encodedKey ||
		extraParts.length
	) {
		return false;
	}

	const salt = Buffer.from(encodedSalt, "base64url");
	const expectedKey = Buffer.from(encodedKey, "base64url");
	if (
		salt.length !== PASSWORD_SALT_LENGTH ||
		expectedKey.length !== PASSWORD_KEY_LENGTH
	) {
		return false;
	}

	const actualKey = await deriveKey(password, salt);
	return timingSafeEqual(actualKey, expectedKey);
}

export async function verifyPasswordOrDummy(
	password: string,
	passwordHash: string | undefined,
): Promise<boolean> {
	const matches = await verifyPassword(
		password,
		passwordHash ?? DUMMY_PASSWORD_HASH,
	);
	return passwordHash !== undefined && matches;
}
