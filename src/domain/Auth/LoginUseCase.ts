import { createHash, randomBytes } from "node:crypto";
import { SignJWT } from "jose";
import { AuthRepository } from "../../persistence/Auth/IAuthRepository";
import { verifyPasswordOrDummy } from "./Password";

const ACCESS_TOKEN_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN
	? parseInt(process.env.ACCESS_TOKEN_EXPIRES_IN, 10)
	: 900;

const REFRESH_TOKEN_EXPIRES_IN_SECONDS = process.env
	.REFRESH_TOKEN_EXPIRES_IN_SECONDS
	? parseInt(process.env.REFRESH_TOKEN_EXPIRES_IN_SECONDS, 10)
	: 30 * 24 * 60 * 60;

const JWT_ISSUER = process.env.JWT_ISSUER ?? "satispadel-api";

const JWT_AUDIENCE = process.env.JWT_AUDIENCE ?? "satispadel-client";

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

export interface LoginResult {
	accessToken: string;
	tokenType: "Bearer";
	expiresIn: number;
	refreshToken: string;
	refreshTokenExpiresAt: string;
}

export class InvalidLoginRequestError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "InvalidLoginRequestError";
	}
}

export class AuthenticationFailedError extends Error {
	constructor() {
		super("Authentication failed.");
		this.name = "AuthenticationFailedError";
	}
}

export class LoginUseCase {
	constructor(
		private readonly authRepository: AuthRepository,
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

		const user = this.authRepository.findUserByEmail(input.email);
		const passwordMatches = await verifyPasswordOrDummy(
			input.password,
			user?.passwordHash,
		);

		if (!user || !passwordMatches) {
			throw new AuthenticationFailedError();
		}

		const accessToken = await new SignJWT({})
			.setProtectedHeader({ alg: "HS256" })
			.setSubject(user.id)
			.setIssuer(JWT_ISSUER)
			.setAudience(JWT_AUDIENCE)
			.setIssuedAt()
			.setExpirationTime("15m")
			.sign(this.signingKey);

		const refreshToken = randomBytes(32).toString("base64url");
		const familyId = randomBytes(16).toString("base64url");
		const refreshTokenExpiresAt = new Date(
			Date.now() + REFRESH_TOKEN_EXPIRES_IN_SECONDS * 1000,
		);
		const tokenHash = createHash("sha256").update(refreshToken).digest("hex");
		this.authRepository.saveRefreshToken({
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
