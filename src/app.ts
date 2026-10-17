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
import { createAuthenticateMiddleware } from "./middleware/authenticate";
import { PrismaPlayerRepository } from "./infrastructure/persistence/Player/PrismaPlayerRepository";
import { InMemoryPlayerRepository } from "./infrastructure/persistence/Player/InMemoryPlayerRepository";
import { PrismaAdminRepository } from "./infrastructure/persistence/Admin/PrismaAdminRepository";
import { InMemoryAdminRepository } from "./infrastructure/persistence/Admin/InMemoryAdminRepository";
import { IAdminRepository } from "./infrastructure/persistence/Admin/IAdminRepository";

export function createApp(useDatabase: boolean = false): Application {
	const app = express();

	app.use(express.json());

	const authRepository = useDatabase
		? new PrismaAuthRepository(prisma)
		: new InMemoryAuthRepository();
	const matchRepository = useDatabase
		? new PrismaMatchRepository(prisma)
		: new InMemoryMatchRepository();
	
	const adminRepository = useDatabase
		? new PrismaAdminRepository(prisma)
		: new InMemoryAdminRepository();
	
	const playerRepository = useDatabase
		? new PrismaPlayerRepository(prisma, adminRepository)
		: new InMemoryPlayerRepository();
	
	const signingKey = resolveSigningKey();
	const authenticate = createAuthenticateMiddleware(signingKey);

	app.get("/", (_req: Request, res: Response) => {
		res.send("Hello World");
	});

	app.use("/auth", createAuthRouter(authRepository, signingKey, authenticate));
	app.use("/players", authenticate, createPlayersRouter(playerRepository));
	app.use("/matches", authenticate, createMatchesRouter(matchRepository));

	return app;
}
