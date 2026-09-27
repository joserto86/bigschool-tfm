import express, { Application } from "express";
import { InMemoryAuthRepository } from "./persistence/Auth/InMemoryAuthRepository";
import { InMemoryMatchRepository } from "./persistence/Match/InMemoryMatchRepository";
import { createAuthRouter } from "./transport/authRoutes";
import { createMatchesRouter } from "./transport/matchesRoutes";

export function createApp(): Application {
  const app = express();

	app.use(express.json());

	// Create repository instance based on configuration
  const authRepository = new InMemoryAuthRepository();
  const matchRepository = new InMemoryMatchRepository();

	app.use("/auth", createAuthRouter(authRepository));
	app.use("/matches", createMatchesRouter(matchRepository));

	return app;
}
