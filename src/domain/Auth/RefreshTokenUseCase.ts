import { createHash, randomBytes } from "node:crypto";
import { SignJWT } from "jose";
import { AuthRepository } from "../../persistence/Auth/IAuthRepository";
import { AuthenticationFailedError, LoginResult } from "./LoginUseCase";

const ACCESS_TOKEN_EXPIRES_IN = 900;
const REFRESH_TOKEN_EXPIRES_IN_SECONDS = 30 * 24 * 60 * 60;
const JWT_ISSUER = "satispadel-api";
const JWT_AUDIENCE = "satispadel-client";

export class RefreshTokenUseCase {
	constructor(
		private readonly authRepository: AuthRepository,
		private readonly signingKey: Uint8Array,
	) {}

	async execute(input: { refreshToken: unknown }): Promise<LoginResult> {
		if (
			typeof input.refreshToken !== "string" ||
			input.refreshToken.length === 0
		) {
			throw new AuthenticationFailedError();
		}

		const presentedTokenHash = createHash("sha256")
			.update(input.refreshToken)
			.digest("hex");
		const presented =
			this.authRepository.findRefreshTokenByHash(presentedTokenHash);
		if (!presented) {
			throw new AuthenticationFailedError();
		}

		const refreshToken = randomBytes(32).toString("base64url");
		const refreshTokenExpiresAt = new Date(
			Date.now() + REFRESH_TOKEN_EXPIRES_IN_SECONDS * 1000,
		);
		const replacementHash = createHash("sha256")
			.update(refreshToken)
			.digest("hex");
		const rotated = this.authRepository.rotateRefreshToken(
			presentedTokenHash,
			{
				tokenHash: replacementHash,
				playerId: presented.playerId,
				familyId: presented.familyId,
				expiresAt: refreshTokenExpiresAt,
				revoked: false,
			},
			new Date(),
		);
		if (!rotated) {
			throw new AuthenticationFailedError();
		}

		const accessToken = await new SignJWT({})
			.setProtectedHeader({ alg: "HS256" })
			.setSubject(presented.playerId)
			.setIssuer(JWT_ISSUER)
			.setAudience(JWT_AUDIENCE)
			.setIssuedAt()
			.setExpirationTime("15m")
			.sign(this.signingKey);

		return {
			accessToken,
			tokenType: "Bearer",
			expiresIn: ACCESS_TOKEN_EXPIRES_IN,
			refreshToken,
			refreshTokenExpiresAt: refreshTokenExpiresAt.toISOString(),
		};
	}
}
