import { createHash, randomBytes } from "node:crypto";
import { SignJWT } from "jose";
import { IAuthRepository } from "../../infrastructure/persistence/Auth/IAuthRepository";
import { jwtAudience, jwtIssuer } from "./Util/jwtConfig";
import { AuthenticationFailedError } from "./Error";
import { LoginResultDto } from "./dto/LoginResultDto";
import { RefreshTokenDto } from "./dto/RefreshTokenDto";
import { ACCESS_TOKEN_EXPIRES_IN, REFRESH_TOKEN_EXPIRES_IN_SECONDS } from "./Constants";

export class RefreshTokenUseCase {
	constructor(
		private readonly authRepository: IAuthRepository,
		private readonly signingKey: Uint8Array,
	) {}

	async execute(input: RefreshTokenDto): Promise<LoginResultDto> {
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
			await this.authRepository.findRefreshTokenByHash(presentedTokenHash);
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
		const rotated = await this.authRepository.rotateRefreshToken(
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
			.setIssuer(jwtIssuer())
			.setAudience(jwtAudience())
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
