import { Router } from "express";
import { AdminMatchesUseCases } from "../../../domain/Admin/AdminMatchesUseCases";
import { IMatchRepository } from "../../persistence/Match/IMatchRepository";
import { IPlayerRepository } from "../../persistence/Player/IPlayerRepository";
import { AdminMatchesController } from "../controllers/AdminMatchesController";

export function createAdminMatchesRouter(
	matchRepository: IMatchRepository,
	playerRepository: IPlayerRepository,
): Router {
	const router = Router();
	const controller = new AdminMatchesController(
		new AdminMatchesUseCases(matchRepository, playerRepository),
	);

	router.get("/", controller.listMatches);
	router.post("/", controller.createMatch);
	router.get("/:matchId", controller.getMatch);
	router.delete("/:matchId", controller.deleteMatch);
	router.post("/:matchId/players", controller.addPlayer);
	router.delete("/:matchId/players/:playerId", controller.removePlayer);
	router.patch("/:matchId/status", controller.updateStatus);

	return router;
}
