import { Router } from "express";
import { CreateMatchUseCase } from "../../../domain/Match/CreateMatchUseCase";
import { GetMatchesByDateTimeUseCase } from "../../../domain/Match/GetMatchesByDateTimeUseCase";
import { GetMatchByIdUseCase } from "../../../domain/Match/GetMatchByIdUseCase";
import { JoinMatchUseCase } from "../../../domain/Match/JoinMatchUseCase";
import { LeaveMatchUseCase } from "../../../domain/Match/LeaveMatchUseCase";
import { ConfirmMatchUseCase } from "../../../domain/Match/ConfirmMatchUseCase";
import { MatchesController } from "../controllers/MatchesController";
import { IMatchRepository } from "../../persistence/Match/IMatchRepository";

export function createMatchesRouter(matchRepository: IMatchRepository): Router {
	const router = Router();

	const createMatchUseCase = new CreateMatchUseCase(matchRepository);
	const getMatchesByDateTimeUseCase = new GetMatchesByDateTimeUseCase(
		matchRepository,
	);
	const getMatchByIdUseCase = new GetMatchByIdUseCase(matchRepository);
	const joinMatchUseCase = new JoinMatchUseCase(matchRepository);
	const leaveMatchUseCase = new LeaveMatchUseCase(matchRepository);
	const confirmMatchUseCase = new ConfirmMatchUseCase(matchRepository);

	const matchesController = new MatchesController(
		createMatchUseCase,
		getMatchesByDateTimeUseCase,
		getMatchByIdUseCase,
		joinMatchUseCase,
		leaveMatchUseCase,
		confirmMatchUseCase,
	);

	router.post("/", matchesController.createMatch);
	router.get("/", matchesController.getMatches);
	router.get("/:matchId", matchesController.getMatchById);
	router.post("/:matchId/players", matchesController.joinMatch);
	router.delete("/:matchId/players/:playerId", matchesController.leaveMatch);
	router.post("/:matchId/confirmation", matchesController.confirmMatch);

	return router;
}
