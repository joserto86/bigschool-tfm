import express, { Request, Response } from "express";
import { randomBytes } from "node:crypto";
import { CreateMatchUseCase } from "./domain/Match/CreateMatchUseCase";
import { GetMatchesByDateTimeUseCase } from "./domain/Match/GetMatchesByDateTimeUseCase";
import { GetMatchByIdUseCase } from "./domain/Match/GetMatchByIdUseCase";
import { JoinMatchUseCase } from "./domain/Match/JoinMatchUseCase";
import { LeaveMatchUseCase } from "./domain/Match/LeaveMatchUseCase";
import { ConfirmMatchUseCase } from "./domain/Match/ConfirmMatchUseCase";
import { ChangePasswordUseCase } from "./domain/Auth/ChangePasswordUseCase";
import { LoginUseCase } from "./domain/Auth/LoginUseCase";
import { RefreshTokenUseCase } from "./domain/Auth/RefreshTokenUseCase";
import { InMemoryMatchRepository } from "./persistence/Match/InMemoryMatchRepository";
import { InMemoryAuthRepository } from "./persistence/Auth/InMemoryAuthRepository";
import { Player } from "./types/player";
import { createMatchesRouter } from "./transport/matchesRoutes";
import { createAuthRouter } from "./transport/authRoutes";

const port = process.env.PORT || 3000;

export interface AppOptions {
	initialUsers?: readonly Player[];
	jwtSecret?: string;
}

export function createApp(options: AppOptions = {}) {
	const matchRepository = new InMemoryMatchRepository();
	const authRepository = new InMemoryAuthRepository(options.initialUsers);
	const createMatchUseCase = new CreateMatchUseCase(matchRepository);
	const getMatchesByDateTimeUseCase = new GetMatchesByDateTimeUseCase(
		matchRepository,
	);
	const getMatchByIdUseCase = new GetMatchByIdUseCase(matchRepository);
	const joinMatchUseCase = new JoinMatchUseCase(matchRepository);
	const leaveMatchUseCase = new LeaveMatchUseCase(matchRepository);
	const confirmMatchUseCase = new ConfirmMatchUseCase(matchRepository);
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
	const changePasswordUseCase = new ChangePasswordUseCase(
		authRepository,
		signingKey,
	);
	const refreshTokenUseCase = new RefreshTokenUseCase(
		authRepository,
		signingKey,
	);
	const app = express();

	app.use(express.json());

	app.get("/", (_req: Request, res: Response) => {
		res.send("Hello World");
	});

	app.use(
		createAuthRouter(loginUseCase, changePasswordUseCase, refreshTokenUseCase),
	);
	app.use(
		createMatchesRouter(
			createMatchUseCase,
			getMatchesByDateTimeUseCase,
			getMatchByIdUseCase,
			joinMatchUseCase,
			leaveMatchUseCase,
			confirmMatchUseCase,
		),
	);

	app.use(
		(
			error: unknown,
			_req: Request,
			res: Response,
			next: (error?: unknown) => void,
		) => {
			if (error instanceof SyntaxError) {
				res.status(400).json({
					code: "INVALID_REQUEST",
					message: "The request body must contain valid JSON.",
				});
				return;
			}
			next(error);
		},
	);

	return app;
}

const app = createApp();

if (require.main === module) {
	app.listen(port, () => {
		console.log(`Server listening on http://localhost:${port}`);
	});
}

export default app;
