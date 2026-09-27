import { Router } from "express";
import { randomBytes } from "node:crypto";
import { ChangePasswordUseCase } from "../domain/Auth/ChangePasswordUseCase";
import { LoginUseCase } from "../domain/Auth/LoginUseCase";
import { RefreshTokenUseCase } from "../domain/Auth/RefreshTokenUseCase";
import { AuthController } from "./controllers/AuthController";
import { Player } from "../types/player";
import { IAuthRepository } from "../persistence/Auth/IAuthRepository";

export interface AppOptions {
	initialUsers?: readonly Player[];
	jwtSecret?: string;
}

export function createAuthRouter(
	authRepository: IAuthRepository,
): Router {
	const router = Router();

	const options: AppOptions = {};
	const jwtSecret = options.jwtSecret ?? process.env.JWT_SECRET;
	if (!jwtSecret && process.env.NODE_ENV === "production") {
		throw new Error("JWT_SECRET must be configured in production.");
	}
	const signingKey = jwtSecret
		? Buffer.from(jwtSecret, "utf8")
		: randomBytes(32);

	if (signingKey.byteLength < 32) {
		throw new Error("JWT_SECRET must be at least 32 bytes long.");
	}

	const loginUseCase = new LoginUseCase(authRepository, signingKey);
	const changePasswordUseCase = new ChangePasswordUseCase(authRepository, signingKey);
	const refreshTokenUseCase = new RefreshTokenUseCase(authRepository, signingKey);

	const authController = new AuthController(loginUseCase, changePasswordUseCase, refreshTokenUseCase);

	router.post("/login", authController.login);
	router.post("/password", authController.changePassword);
	router.post("/refresh", authController.refresh);

	return router;
}
