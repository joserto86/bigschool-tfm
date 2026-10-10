import express, { Request, Response, Application } from "express";
import { resolveSigningKey } from "./domain/Auth/signingKey";
import { InMemoryAuthRepository } from "./infrastructure/persistence/Auth/InMemoryAuthRepository";
import { PrismaAuthRepository } from "./infrastructure/persistence/Auth/PrismaAuthRepository";
import { InMemoryMatchRepository } from "./infrastructure/persistence/Match/InMemoryMatchRepository";
import { PrismaMatchRepository } from "./infrastructure/persistence/Match/PrismaMatchRepository";
import { prisma } from "./infrastructure/database/prisma";
import { createAuthRouter } from "./infrastructure/transport/routes/authRoutes";
import { createMatchesRouter } from "./infrastructure/transport/routes/matchesRoutes";
import { createAuthenticateMiddleware } from "./middleware/authenticate";

export function createApp(useDatabase: boolean = false): Application {
	const app = express();

	app.use(express.json());

	const authRepository = useDatabase
		? new PrismaAuthRepository(prisma)
		: new InMemoryAuthRepository();
	const matchRepository = useDatabase
		? new PrismaMatchRepository(prisma)
		: new InMemoryMatchRepository();

	const signingKey = resolveSigningKey();
	const authenticate = createAuthenticateMiddleware(signingKey);

	app.get("/", (_req: Request, res: Response) => {
		res.send("Hello World");
	});

	app.use("/auth", createAuthRouter(authRepository, signingKey, authenticate));
	app.use("/matches", authenticate, createMatchesRouter(matchRepository));

	return app;
}
