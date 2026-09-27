import { Request, Response } from "express";
import {
	AuthenticationFailedError,
	InvalidLoginRequestError,
	LoginUseCase,
} from "../../domain/Auth/LoginUseCase";
import {
	ChangePasswordUseCase,
	InvalidPasswordRequestError,
} from "../../domain/Auth/ChangePasswordUseCase";
import { RefreshTokenUseCase } from "../../domain/Auth/RefreshTokenUseCase";

export class AuthController {
	constructor(
		private readonly loginUseCase: LoginUseCase,
		private readonly changePasswordUseCase: ChangePasswordUseCase,
		private readonly refreshTokenUseCase: RefreshTokenUseCase,
	) {}

	login = async (req: Request, res: Response): Promise<void> => {
		try {
			const result = await this.loginUseCase.execute({
				email: req.body?.email,
				password: req.body?.password,
			});
			res.status(200).json(result);
		} catch (error) {
			if (error instanceof InvalidLoginRequestError) {
				res.status(400).json({
					code: "INVALID_REQUEST",
					message: error.message,
				});
				return;
			}
			if (error instanceof AuthenticationFailedError) {
				res.status(401).json({
					code: "AUTHENTICATION_FAILED",
					message: "Authentication failed.",
				});
				return;
			}
			throw error;
		}
	};

	changePassword = async (req: Request, res: Response): Promise<void> => {
		const authorization = req.header("authorization");
		const separator = authorization?.indexOf(" ") ?? -1;
		const scheme = separator > 0 ? authorization?.slice(0, separator) : "";
		const accessToken =
			separator > 0 ? authorization?.slice(separator).trim() : "";
		if (scheme?.toLowerCase() !== "bearer" || !accessToken) {
			res.status(401).json({
				code: "AUTHENTICATION_FAILED",
				message: "Authentication failed.",
			});
			return;
		}

		try {
			await this.changePasswordUseCase.execute(accessToken, {
				currentPassword: req.body?.currentPassword,
				newPassword: req.body?.newPassword,
			});
			res.status(204).end();
		} catch (error) {
			if (error instanceof InvalidPasswordRequestError) {
				res
					.status(400)
					.json({ code: "INVALID_REQUEST", message: error.message });
				return;
			}
			if (error instanceof AuthenticationFailedError) {
				res.status(401).json({
					code: "AUTHENTICATION_FAILED",
					message: "Authentication failed.",
				});
				return;
			}
			throw error;
		}
	};

	refresh = async (req: Request, res: Response): Promise<void> => {
		try {
			const result = await this.refreshTokenUseCase.execute({
				refreshToken: req.body?.refreshToken,
			});
			res.status(200).json(result);
		} catch (error) {
			if (error instanceof AuthenticationFailedError) {
				res.status(401).json({
					code: "AUTHENTICATION_FAILED",
					message: "Authentication failed.",
				});
				return;
			}
			throw error;
		}
	};
}
