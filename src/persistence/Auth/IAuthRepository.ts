import { Player } from "../../types/player";

export interface RefreshTokenRecord {
	tokenHash: string;
	playerId: string;
	familyId: string;
	expiresAt: Date;
	revoked: boolean;
}

export interface AuthRepository {
	findUserByEmail(email: string): Player | undefined;
	findUserById(playerId: string): Player | undefined;
	updatePasswordHash(playerId: string, passwordHash: string): void;
	saveRefreshToken(record: RefreshTokenRecord): void;
	findRefreshTokenByHash(tokenHash: string): RefreshTokenRecord | undefined;
	rotateRefreshToken(
		presentedTokenHash: string,
		replacement: RefreshTokenRecord,
		now: Date,
	): boolean;
	revokeActiveRefreshTokens(playerId: string): void;
}
