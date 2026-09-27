import { Player } from "../../types/player";

export interface IRefreshTokenRecord {
	tokenHash: string;
	playerId: string;
	familyId: string;
	expiresAt: Date;
	revoked: boolean;
}

export interface IAuthRepository {
	findUserByEmail(email: string): Player | undefined;
	findUserById(playerId: string): Player | undefined;
	updatePasswordHash(playerId: string, passwordHash: string): void;
	saveRefreshToken(record: IRefreshTokenRecord): void;
	findRefreshTokenByHash(tokenHash: string): IRefreshTokenRecord | undefined;
	rotateRefreshToken(
		presentedTokenHash: string,
		replacement: IRefreshTokenRecord,
		now: Date,
	): boolean;
	revokeActiveRefreshTokens(playerId: string): void;
}
