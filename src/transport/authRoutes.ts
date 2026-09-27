import { Router } from "express";
import { ChangePasswordUseCase } from "../domain/Auth/ChangePasswordUseCase";
import { LoginUseCase } from "../domain/Auth/LoginUseCase";
import { RefreshTokenUseCase } from "../domain/Auth/RefreshTokenUseCase";
import { AuthController } from "./controllers/AuthController";

export function createAuthRouter(
	loginUseCase: LoginUseCase,
	changePasswordUseCase: ChangePasswordUseCase,
	refreshTokenUseCase: RefreshTokenUseCase,
): Router {
	const router = Router();
	const authController = new AuthController(
		loginUseCase,
		changePasswordUseCase,
		refreshTokenUseCase,
	);

	router.post("/auth/login", authController.login);
	router.post("/auth/password", authController.changePassword);
	router.post("/auth/refresh", authController.refresh);

	return router;
}
