import { createHash, randomBytes } from "node:crypto";
import { SignJWT } from "jose";
import { IAuthRepository } from "../../infrastructure/persistence/Auth/IAuthRepository";
import { verifyPasswordOrDummy } from "./Util/Password";
import { jwtAudience, jwtIssuer } from "./Util/jwtConfig";
import { IPlayerRepository } from "../../infrastructure/persistence/Player/IPlayerRepository";
import { AuthenticationFailedError, InvalidLoginRequestError } from "./Error";
import {
	ACCESS_TOKEN_EXPIRES_IN,
	REFRESH_TOKEN_EXPIRES_IN_SECONDS,
} from "./Constants";
import { LoginResult } from "./dto/LoginResultDto";

function isValidEmail(email: string): boolean {
	const normalizedEmail = email.trim();
	const atIndex = normalizedEmail.indexOf("@");
	const domain = normalizedEmail.slice(atIndex + 1);
	return (
		atIndex > 0 &&
		normalizedEmail.lastIndexOf("@") === atIndex &&
		!/\s/.test(normalizedEmail) &&
		domain.includes(".") &&
		!domain.startsWith(".") &&
		!domain.endsWith(".")
	);
}

export class LoginUseCase {
	constructor(
		private readonly authRepository: IAuthRepository,
		private readonly playerRepository: IPlayerRepository,
		private readonly signingKey: Uint8Array,
	) {}

	async execute(input: {
		email: string;
		password: string;
	}): Promise<LoginResult> {
		if (
			typeof input.email !== "string" ||
			!isValidEmail(input.email) ||
			typeof input.password !== "string" ||
			input.password.length === 0
		) {
			throw new InvalidLoginRequestError(
				"A valid email and non-empty password are required.",
			);
		}

		const user = await this.playerRepository.findByEmail(input.email);
		const passwordMatches = await verifyPasswordOrDummy(
			input.password,
			user?.passwordHash,
		);

		if (!user?.active || !passwordMatches) {
			throw new AuthenticationFailedError();
		}

		const accessToken = await new SignJWT({ isAdmin: user.isAdmin })
			.setProtectedHeader({ alg: "HS256" })
			.setSubject(user.id)
			.setIssuer(jwtIssuer())
			.setAudience(jwtAudience())
			.setIssuedAt()
			.setExpirationTime("15m")
			.sign(this.signingKey);

		const refreshToken = randomBytes(32).toString("base64url");
		const familyId = randomBytes(16).toString("base64url");
		const refreshTokenExpiresAt = new Date(
			Date.now() + REFRESH_TOKEN_EXPIRES_IN_SECONDS * 1000,
		);
		const tokenHash = createHash("sha256").update(refreshToken).digest("hex");
		await this.authRepository.saveRefreshToken({
			tokenHash,
			playerId: user.id,
			familyId,
			expiresAt: refreshTokenExpiresAt,
			revoked: false,
		});

		return {
			accessToken,
			tokenType: "Bearer",
			expiresIn: ACCESS_TOKEN_EXPIRES_IN,
			refreshToken,
			refreshTokenExpiresAt: refreshTokenExpiresAt.toISOString(),
		};
	}
}
