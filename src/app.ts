import express, { Application } from "express";
import { resolveSigningKey } from "./domain/Auth/signingKey";
import { InMemoryAuthRepository } from "./persistence/Auth/InMemoryAuthRepository";
import { InMemoryMatchRepository } from "./persistence/Match/InMemoryMatchRepository";
import { createAuthRouter } from "./transport/authRoutes";
import { createMatchesRouter } from "./transport/matchesRoutes";
import { createAuthenticateMiddleware } from "./transport/middleware/authenticate";

export function createApp(): Application {
  const app = express();

	app.use(express.json());

	// Create repository instance based on configuration
  const authRepository = new InMemoryAuthRepository();
  const matchRepository = new InMemoryMatchRepository();

	const signingKey = resolveSigningKey();
	const authenticate = createAuthenticateMiddleware(signingKey);

	app.use("/auth", createAuthRouter(authRepository, signingKey, authenticate));
	app.use("/matches", authenticate, createMatchesRouter(matchRepository));

	return app;
}
