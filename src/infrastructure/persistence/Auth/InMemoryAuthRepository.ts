import { Player } from "../../../types/player";
import { IAuthRepository, IRefreshTokenRecord } from "./IAuthRepository";

// const DEVELOPMENT_TEST_USER: Player | undefined =
// 	process.env.NODE_ENV === "production"
// 		? undefined
// 		: {
// 				id: "test-player",
// 				name: "Test Player",
// 				email: "player@example.com",
// 				phone: "+34600111222",
// 				passwordHash: hashPasswordSync("correct-password"),
// 				isAdmin: false,
// 				active: true,
// 				createdAt: new Date(),
// 				updatedAt: null,
// 			};

export class InMemoryAuthRepository implements IAuthRepository {
	private readonly users: Player[];
	private readonly refreshTokens = new Map<string, IRefreshTokenRecord>();

	constructor(initialUsers: readonly Player[] = []) {
		this.users = [...initialUsers];
	}

	async updatePasswordHash(
		playerId: string,
		passwordHash: string,
	): Promise<void> {
		const user = this.users.find((entry) => entry.id === playerId);
		if (user) {
			user.passwordHash = passwordHash;
		}
	}

	async saveRefreshToken(record: IRefreshTokenRecord): Promise<void> {
		this.refreshTokens.set(record.tokenHash, {
			...record,
			expiresAt: new Date(record.expiresAt),
		});
	}

	async findRefreshTokenByHash(
		tokenHash: string,
	): Promise<IRefreshTokenRecord | undefined> {
		const record = this.refreshTokens.get(tokenHash);
		return record
			? { ...record, expiresAt: new Date(record.expiresAt) }
			: undefined;
	}

	async rotateRefreshToken(
		presentedTokenHash: string,
		replacement: IRefreshTokenRecord,
		now: Date,
	): Promise<boolean> {
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
		await this.saveRefreshToken(replacement);
		return true;
	}

	async revokeActiveRefreshTokens(playerId: string): Promise<void> {
		for (const record of this.refreshTokens.values()) {
			if (record.playerId === playerId && !record.revoked) {
				record.revoked = true;
			}
		}
	}
}
