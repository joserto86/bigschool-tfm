import { RequestHandler, Router } from "express";
import { ChangePasswordUseCase } from "../domain/Auth/ChangePasswordUseCase";
import { LoginUseCase } from "../domain/Auth/LoginUseCase";
import { RefreshTokenUseCase } from "../domain/Auth/RefreshTokenUseCase";
import { AuthController } from "./controllers/AuthController";
import { IAuthRepository } from "../persistence/Auth/IAuthRepository";

export function createAuthRouter(
	authRepository: IAuthRepository,
	signingKey: Uint8Array,
	authenticate: RequestHandler,
): Router {
	const router = Router();

	const loginUseCase = new LoginUseCase(authRepository, signingKey);
	const changePasswordUseCase = new ChangePasswordUseCase(authRepository);
	const refreshTokenUseCase = new RefreshTokenUseCase(authRepository, signingKey);

	const authController = new AuthController(loginUseCase, changePasswordUseCase, refreshTokenUseCase);

	router.post("/login", authController.login);
	router.post("/password", authenticate, authController.changePassword);
	router.post("/refresh", authController.refresh);

	return router;
}
