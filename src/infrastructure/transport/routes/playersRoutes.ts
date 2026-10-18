import { Router } from "express";
import {
	GetOwnPlayerUseCase,
	UpdateOwnPlayerUseCase,
} from "../../../domain/Player/OwnPlayerUseCases";
import { PlayersController } from "../controllers/PlayersController";
import { IPlayerRepository } from "../../persistence/Player/IPlayerRepository";

export function createPlayersRouter(
	playerRepository: IPlayerRepository,
): Router {
	const router = Router();
	const playersController = new PlayersController(
		new GetOwnPlayerUseCase(playerRepository),
		new UpdateOwnPlayerUseCase(playerRepository),
	);

	router.get("/me", playersController.getOwnPlayer);
	router.patch("/me", playersController.updateOwnPlayer);

	return router;
}
