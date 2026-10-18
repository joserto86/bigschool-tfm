import { IAuthRepository } from "../../infrastructure/persistence/Auth/IAuthRepository";
import { hashPassword, verifyPassword } from "./Password";
import { AuthenticationFailedError } from "./LoginUseCase";
import { IPlayerRepository } from "../../infrastructure/persistence/Player/IPlayerRepository";

const MIN_PASSWORD_LENGTH = Number.parseInt(process.env.MIN_PASSWORD_LENGTH ?? "8", 10);
const MAX_PASSWORD_LENGTH = Number.parseInt(process.env.MAX_PASSWORD_LENGTH ?? "128", 10);

export class InvalidPasswordRequestError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "InvalidPasswordRequestError";
	}
}

export class ChangePasswordUseCase {
	constructor(
		private readonly authRepository: IAuthRepository,
		private readonly playerRepository: IPlayerRepository,
	) {}

	async execute(
		playerId: string,
		input: { currentPassword: string; newPassword: string },
	): Promise<void> {
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

		const user = await this.playerRepository.findById(playerId);
		if (
			!user ||
			!(await verifyPassword(input.currentPassword, user.passwordHash))
		) {
			throw new AuthenticationFailedError();
		}

		const passwordHash = await hashPassword(input.newPassword);
		await this.authRepository.updatePasswordHash(playerId, passwordHash);
		await this.authRepository.revokeActiveRefreshTokens(playerId);
	}
}
