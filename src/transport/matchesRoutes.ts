import { Router } from "express";
import { CreateMatchUseCase } from "../domain/Match/CreateMatchUseCase";
import { GetMatchesByDateTimeUseCase } from "../domain/Match/GetMatchesByDateTimeUseCase";
import { GetMatchByIdUseCase } from "../domain/Match/GetMatchByIdUseCase";
import { JoinMatchUseCase } from "../domain/Match/JoinMatchUseCase";
import { LeaveMatchUseCase } from "../domain/Match/LeaveMatchUseCase";
import { ConfirmMatchUseCase } from "../domain/Match/ConfirmMatchUseCase";
import { MatchesController } from "./controllers/MatchesController";

export function createMatchesRouter(
	createMatchUseCase: CreateMatchUseCase,
	getMatchesByDateTimeUseCase: GetMatchesByDateTimeUseCase,
	getMatchByIdUseCase: GetMatchByIdUseCase,
	joinMatchUseCase: JoinMatchUseCase,
	leaveMatchUseCase: LeaveMatchUseCase,
	confirmMatchUseCase: ConfirmMatchUseCase,
): Router {
	const router = Router();
	const matchesController = new MatchesController(
		createMatchUseCase,
		getMatchesByDateTimeUseCase,
		getMatchByIdUseCase,
		joinMatchUseCase,
		leaveMatchUseCase,
		confirmMatchUseCase,
	);

	router.post("/matches", matchesController.createMatch);
	router.get("/matches", matchesController.getMatches);
	router.get("/matches/:matchId", matchesController.getMatchById);
	router.post("/matches/:matchId/players", matchesController.joinMatch);
	router.delete(
		"/matches/:matchId/players/:playerId",
		matchesController.leaveMatch,
	);
	router.post("/matches/:matchId/confirmation", matchesController.confirmMatch);

	return router;
}
