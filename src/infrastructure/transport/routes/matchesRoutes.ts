import { Router } from "express";
import { CreateMatchUseCase } from "../../../domain/Match/CreateMatchUseCase";
import { GetMatchesUseCase } from "../../../domain/Match/GetMatchesUseCase";
import { JoinMatchUseCase } from "../../../domain/Match/JoinMatchUseCase";
import { LeaveMatchUseCase } from "../../../domain/Match/LeaveMatchUseCase";
import { ConfirmMatchUseCase } from "../../../domain/Match/ConfirmMatchUseCase";
import { MatchesController } from "../controllers/MatchesController";
import { IMatchRepository } from "../../persistence/Match/IMatchRepository";

export function createMatchesRouter(matchRepository: IMatchRepository): Router {
	const router = Router();

	const createMatchUseCase = new CreateMatchUseCase(matchRepository);
	const getMatchesUseCase = new GetMatchesUseCase(matchRepository);
	const joinMatchUseCase = new JoinMatchUseCase(matchRepository);
	const leaveMatchUseCase = new LeaveMatchUseCase(matchRepository);
	const confirmMatchUseCase = new ConfirmMatchUseCase(matchRepository);

	const matchesController = new MatchesController(
		createMatchUseCase,
		getMatchesUseCase,
		joinMatchUseCase,
		leaveMatchUseCase,
		confirmMatchUseCase,
	);

	router.post("/", matchesController.createMatch);
	router.get("/", matchesController.getMatches);
	router.get("/:matchId", matchesController.getMatchById);
	router.post("/:matchId/players", matchesController.joinMatch);
	router.delete("/:matchId/players", matchesController.leaveMatch);
	router.post("/:matchId/confirmation", matchesController.confirmMatch);

	return router;
}
