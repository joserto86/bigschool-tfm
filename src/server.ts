import express, { Request, Response } from "express";
import { InMemoryMatchRepository } from "./persistence/Match/InMemoryMatchRepository";
import { InMemoryAuthRepository } from "./persistence/Auth/InMemoryAuthRepository";
import { createMatchesRouter } from "./transport/matchesRoutes";
import { createAuthRouter } from "./transport/authRoutes";

const PORT = process.env.PORT || 3000;
const DATABASE_TYPE = process.env.DATABASE_TYPE || 'In Memory';

async function startServer() {
	try {
		const app = express();
		app.use(express.json());

		app.get("/", (_req: Request, res: Response) => {
			res.send("Hello World");
		});

		const authRepository = new InMemoryAuthRepository();
		const matchRepository = new InMemoryMatchRepository();

		app.use("/auth", createAuthRouter(authRepository));
		app.use("/matches", createMatchesRouter(matchRepository));

		app.listen(PORT, () => {
			console.log(`Server is running on http://localhost:${PORT}`);
			console.log(
				`Using ${DATABASE_TYPE} repository`,
			);
		});

	} catch (error) {
		console.error("Failed to start server:", error);
		process.exit(1);
	}
}

startServer();
