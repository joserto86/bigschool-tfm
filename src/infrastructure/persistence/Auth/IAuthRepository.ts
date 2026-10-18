import { Player } from "../../../types/player";

export interface IRefreshTokenRecord {
	tokenHash: string;
	playerId: string;
	familyId: string;
	expiresAt: Date;
	revoked: boolean;
}

export interface IAuthRepository {
	updatePasswordHash(playerId: string, passwordHash: string): Promise<void>;
	
	saveRefreshToken(record: IRefreshTokenRecord): Promise<void>;
	
	findRefreshTokenByHash(
		tokenHash: string,
	): Promise<IRefreshTokenRecord | undefined>;
	
	rotateRefreshToken(
		presentedTokenHash: string,
		replacement: IRefreshTokenRecord,
		now: Date,
	): Promise<boolean>;
	
	revokeActiveRefreshTokens(playerId: string): Promise<void>;
}
