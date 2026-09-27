import { Player } from "../../types/player";
import { AuthRepository, RefreshTokenRecord } from "./IAuthRepository";

export class InMemoryAuthRepository implements AuthRepository {
	private readonly users: Player[];
	private readonly refreshTokens = new Map<string, RefreshTokenRecord>();

	constructor(initialUsers: readonly Player[] = []) {
		this.users = [...initialUsers];
		this.users.push({
			id: "1",
			email: "john@doe.com",
			passwordHash: "hashedpassword",
			isAdmin: false,
			name: "John Doe",
		});
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

	saveRefreshToken(record: RefreshTokenRecord): void {
		this.refreshTokens.set(record.tokenHash, {
			...record,
			expiresAt: new Date(record.expiresAt),
		});
	}

	findRefreshTokenByHash(tokenHash: string): RefreshTokenRecord | undefined {
		const record = this.refreshTokens.get(tokenHash);
		return record
			? { ...record, expiresAt: new Date(record.expiresAt) }
			: undefined;
	}

	rotateRefreshToken(
		presentedTokenHash: string,
		replacement: RefreshTokenRecord,
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
