import { hashPasswordSync } from "../../domain/Auth/Password";
import { Player } from "../../types/player";
import { IAuthRepository, IRefreshTokenRecord } from "./IAuthRepository";

const DEVELOPMENT_TEST_USER: Player | undefined =
	process.env.NODE_ENV === "production"
		? undefined
		: {
				id: "test-player",
				name: "Test Player",
				email: "player@example.com",
				passwordHash: hashPasswordSync("correct-password"),
				isAdmin: false,
			};

export class InMemoryAuthRepository implements IAuthRepository {
	private readonly users: Player[];
	private readonly refreshTokens = new Map<string, IRefreshTokenRecord>();

	constructor(initialUsers: readonly Player[] = []) {
		this.users = [...initialUsers];

		if (
			DEVELOPMENT_TEST_USER &&
			!this.users.some(
				(user) => user.email.trim().toLowerCase() === "player@example.com",
			)
		) {
			this.users.push({ ...DEVELOPMENT_TEST_USER });
		}
	}

	findUserByEmail(email: string): Player | undefined {
		const normalizedEmail = email.trim().toLowerCase();
		return this.users.find(
			(user) => user.email.trim().toLowerCase() === normalizedEmail,
		);
	}

	findUserById(playerId: string): Player | undefined {
		return this.users.find((user) => user.id === playerId);
	}

	updatePasswordHash(playerId: string, passwordHash: string): void {
		const user = this.findUserById(playerId);
		if (user) {
			user.passwordHash = passwordHash;
		}
	}

	saveRefreshToken(record: IRefreshTokenRecord): void {
		this.refreshTokens.set(record.tokenHash, {
			...record,
			expiresAt: new Date(record.expiresAt),
		});
	}

	findRefreshTokenByHash(tokenHash: string): IRefreshTokenRecord | undefined {
		const record = this.refreshTokens.get(tokenHash);
		return record
			? { ...record, expiresAt: new Date(record.expiresAt) }
			: undefined;
	}

	rotateRefreshToken(
		presentedTokenHash: string,
		replacement: IRefreshTokenRecord,
		now: Date,
	): boolean {
		const presented = this.refreshTokens.get(presentedTokenHash);
		if (!presented) {
			return false;
		}

		if (presented.revoked) {
			for (const record of this.refreshTokens.values()) {
				if (record.familyId === presented.familyId) {
					record.revoked = true;
				}
			}
			return false;
		}

		if (presented.expiresAt <= now) {
			presented.revoked = true;
			return false;
		}

		presented.revoked = true;
		this.saveRefreshToken(replacement);
		return true;
	}

	revokeActiveRefreshTokens(playerId: string): void {
		for (const record of this.refreshTokens.values()) {
			if (record.playerId === playerId && !record.revoked) {
				record.revoked = true;
			}
		}
	}
}
