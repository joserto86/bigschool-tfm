import { IAuthRepository } from "../../persistence/Auth/IAuthRepository";
import { hashPassword, verifyPassword } from "./Password";
import { AuthenticationFailedError } from "./LoginUseCase";

const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;

export class InvalidPasswordRequestError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "InvalidPasswordRequestError";
	}
}

export class ChangePasswordUseCase {
	constructor(private readonly authRepository: IAuthRepository) {}

	async execute(
		playerId: string,
		input: { currentPassword: unknown; newPassword: unknown },
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
