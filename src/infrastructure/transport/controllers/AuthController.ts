import { Request, Response } from "express";
import { LoginUseCase } from "../../../domain/Auth/LoginUseCase";
import { ChangePasswordUseCase } from "../../../domain/Auth/ChangePasswordUseCase";
import { RefreshTokenUseCase } from "../../../domain/Auth/RefreshTokenUseCase";
import { AuthenticationFailedError, InvalidLoginRequestError, InvalidPasswordRequestError } from "../../../domain/Auth/Error";
import { LoginResultDto } from "../../../domain/Auth/dto/LoginResultDto";

function getRefreshTokenCookie(request: Request): string | undefined {
	const cookieHeader = request.headers.cookie;
	if (!cookieHeader) {
		return undefined;
	}

	for (const cookie of cookieHeader.split(";")) {
		const separatorIndex = cookie.indexOf("=");
		if (
			separatorIndex !== -1 &&
			cookie.slice(0, separatorIndex).trim() === "refreshToken"
		) {
			return cookie.slice(separatorIndex + 1).trim();
		}
	}

	return undefined;
}

export class AuthController {
	constructor(
		private readonly loginUseCase: LoginUseCase,
		private readonly changePasswordUseCase: ChangePasswordUseCase,
		private readonly refreshTokenUseCase: RefreshTokenUseCase,
	) {}

	private sendTokenResponse(res: Response, result: LoginResultDto): void {
		res.cookie("refreshToken", result.refreshToken, {
			httpOnly: true,
			secure: true,
			sameSite: "strict",
			path: "/api/auth",
			expires: new Date(result.refreshTokenExpiresAt),
		});
		res.status(200).json({
			accessToken: result.accessToken,
			tokenType: result.tokenType,
			expiresIn: result.expiresIn,
			refreshTokenExpiresAt: result.refreshTokenExpiresAt,
		});
	}

	login = async (req: Request, res: Response): Promise<void> => {
		try {
			const result = await this.loginUseCase.execute({
				email: req.body?.email,
				password: req.body?.password,
			});
			this.sendTokenResponse(res, result);
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
		const playerId = req.auth?.playerId;
		if (!playerId) {
			res.status(401).json({
				code: "AUTHENTICATION_FAILED",
				message: "Authentication failed.",
			});
			return;
		}

		try {
			await this.changePasswordUseCase.execute(playerId, {
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
				refreshToken: getRefreshTokenCookie(req),
			});
			this.sendTokenResponse(res, result);
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
