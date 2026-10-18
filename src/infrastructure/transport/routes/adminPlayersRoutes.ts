import { Router } from "express";
import { AdminPlayersUseCases } from "../../../domain/Admin/AdminPlayersUseCases";
import { IPlayerRepository } from "../../persistence/Player/IPlayerRepository";
import { AdminPlayersController } from "../controllers/AdminPlayersController";

export function createAdminPlayersRouter(
	repository: IPlayerRepository,
): Router {
	const router = Router();
	const controller = new AdminPlayersController(
		new AdminPlayersUseCases(repository),
	);

	router.get("/", controller.listPlayers);
	router.post("/", controller.createPlayer);
	router.get("/:playerId", controller.getPlayer);
	router.patch("/:playerId", controller.updatePlayer);
	router.delete("/:playerId", controller.deletePlayer);
	router.patch("/:playerId/status", controller.updatePlayerStatus);

	return router;
}
