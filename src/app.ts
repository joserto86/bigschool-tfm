import express, { Request, Response, Application } from "express";
import { resolveSigningKey } from "./domain/Auth/signingKey";
import { InMemoryAuthRepository } from "./infrastructure/persistence/Auth/InMemoryAuthRepository";
import { PrismaAuthRepository } from "./infrastructure/persistence/Auth/PrismaAuthRepository";
import { InMemoryMatchRepository } from "./infrastructure/persistence/Match/InMemoryMatchRepository";
import { PrismaMatchRepository } from "./infrastructure/persistence/Match/PrismaMatchRepository";
import { prisma } from "./infrastructure/database/prisma";
import { createAuthRouter } from "./infrastructure/transport/routes/authRoutes";
import { createMatchesRouter } from "./infrastructure/transport/routes/matchesRoutes";
import { createPlayersRouter } from "./infrastructure/transport/routes/playersRoutes";
import { createAdminPlayersRouter } from "./infrastructure/transport/routes/adminPlayersRoutes";
import { createAuthenticateMiddleware } from "./middleware/authenticate";
import { requireAdmin } from "./middleware/requireAdmin";
import { PrismaPlayerRepository } from "./infrastructure/persistence/Player/PrismaPlayerRepository";
import { InMemoryPlayerRepository } from "./infrastructure/persistence/Player/InMemoryPlayerRepository";

export function createApp(useDatabase: boolean = false): Application {
	const app = express();

	app.use(express.json());

	const authRepository = useDatabase
		? new PrismaAuthRepository(prisma)
		: new InMemoryAuthRepository();
	
	const playerRepository = useDatabase
		? new PrismaPlayerRepository(prisma)
		: new InMemoryPlayerRepository();
	
	const matchRepository = useDatabase
		? new PrismaMatchRepository(prisma)
		: new InMemoryMatchRepository();
	
	const signingKey = resolveSigningKey();
	const authenticate = createAuthenticateMiddleware(signingKey);

	app.get("/", (_req: Request, res: Response) => {
		res.send("Hello World");
	});

	app.use("/auth", createAuthRouter(authRepository, playerRepository, signingKey, authenticate));
	app.use("/admin/players", authenticate, requireAdmin, createAdminPlayersRouter(playerRepository));
	app.use("/players", authenticate, createPlayersRouter(playerRepository));
	app.use("/matches", authenticate, createMatchesRouter(matchRepository));

	return app;
}
