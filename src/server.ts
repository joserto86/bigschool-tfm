import express, { Request, Response } from "express";
import { CreateMatchUseCase } from "./domain/CreateMatchUseCase";
import { GetMatchesByDateTimeUseCase } from "./domain/GetMatchesByDateTimeUseCase";
import { GetMatchByIdUseCase } from "./domain/GetMatchByIdUseCase";
import { JoinMatchUseCase } from "./domain/JoinMatchUseCase";
import { LeaveMatchUseCase } from "./domain/LeaveMatchUseCase";
import { ConfirmMatchUseCase } from "./domain/ConfirmMatchUseCase";
import { InMemoryMatchRepository } from "./persistence/InMemoryMatchRepository";
import { createMatchesRouter } from "./transport/matchesRoutes";

const matchRepository = new InMemoryMatchRepository();
const createMatchUseCase = new CreateMatchUseCase(matchRepository);
const getMatchesByDateTimeUseCase = new GetMatchesByDateTimeUseCase(
	matchRepository,
);
const getMatchByIdUseCase = new GetMatchByIdUseCase(matchRepository);
const joinMatchUseCase = new JoinMatchUseCase(matchRepository);
const leaveMatchUseCase = new LeaveMatchUseCase(matchRepository);
const confirmMatchUseCase = new ConfirmMatchUseCase(matchRepository);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.get("/", (_req: Request, res: Response) => {
	res.send("Hello World");
});

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

if (require.main === module) {
	app.listen(port, () => {
		console.log(`Server listening on http://localhost:${port}`);
	});
}

export default app;
