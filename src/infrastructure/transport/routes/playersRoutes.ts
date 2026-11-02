import { Router } from "express";
import {
	GetOwnPlayerUseCase,
	UpdateOwnPlayerUseCase,
} from "../../../domain/Player/OwnPlayerUseCases";
import { GetMatchesUseCase } from "../../../domain/Match/GetMatchesUseCase";
import { PlayersController } from "../controllers/PlayersController";
import { IPlayerRepository } from "../../persistence/Player/IPlayerRepository";
import { IMatchRepository } from "../../persistence/Match/IMatchRepository";

export function createPlayersRouter(
	playerRepository: IPlayerRepository,
	matchRepository: IMatchRepository,
): Router {
	const router = Router();
	const playersController = new PlayersController(
		new GetOwnPlayerUseCase(playerRepository),
		new UpdateOwnPlayerUseCase(playerRepository),
		new GetMatchesUseCase(matchRepository),
		playerRepository,
	);

	router.get("/me", playersController.getOwnPlayer);
	router.patch("/me", playersController.updateOwnPlayer);
	router.get("/matches", playersController.getOwnPlayerMatches);

	return router;
}
