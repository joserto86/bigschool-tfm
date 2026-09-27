import { jwtVerify } from "jose";
import { AuthRepository } from "../../persistence/Auth/IAuthRepository";
import { hashPassword, verifyPassword } from "./Password";
import { AuthenticationFailedError } from "./LoginUseCase";

const JWT_ISSUER = "satispadel-api";
const JWT_AUDIENCE = "satispadel-client";
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;

export class InvalidPasswordRequestError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "InvalidPasswordRequestError";
	}
}

export class ChangePasswordUseCase {
	constructor(
		private readonly authRepository: AuthRepository,
		private readonly signingKey: Uint8Array,
	) {}

	async execute(
		accessToken: string,
		input: { currentPassword: unknown; newPassword: unknown },
	): Promise<void> {
		let playerId: string;
		try {
			const { payload } = await jwtVerify(accessToken, this.signingKey, {
				algorithms: ["HS256"],
				issuer: JWT_ISSUER,
				audience: JWT_AUDIENCE,
			});
			if (!payload.sub) {
				throw new Error("Missing subject");
			}
			playerId = payload.sub;
		} catch {
			throw new AuthenticationFailedError();
		}

		if (
			typeof input.currentPassword !== "string" ||
			input.currentPassword.length === 0 ||
			typeof input.newPassword !== "string" ||
			input.newPassword.length < MIN_PASSWORD_LENGTH ||
			input.newPassword.length > MAX_PASSWORD_LENGTH
		) {
			throw new InvalidPasswordRequestError(
				`The new password must be between ${MIN_PASSWORD_LENGTH} and ${MAX_PASSWORD_LENGTH} characters.`,
			);
		}

		const user = this.authRepository.findUserById(playerId);
		if (
			!user ||
			!(await verifyPassword(input.currentPassword, user.passwordHash))
		) {
			throw new AuthenticationFailedError();
		}

		const passwordHash = await hashPassword(input.newPassword);
		this.authRepository.updatePasswordHash(playerId, passwordHash);
		this.authRepository.revokeActiveRefreshTokens(playerId);
	}
}
