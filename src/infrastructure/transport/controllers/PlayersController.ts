import { Request, Response } from "express";
import {
	GetOwnPlayerUseCase,
	InvalidOwnPlayerUpdateError,
	OwnPlayerEmailConflictError,
	UpdateOwnPlayerUseCase,
} from "../../../domain/Player/OwnPlayerUseCases";
import { GetMatchesUseCase } from "../../../domain/Match/GetMatchesUseCase";
import { AuthenticationFailedError } from "../../../domain/Auth/Error";
import { IPlayerRepository } from "../../persistence/Player/IPlayerRepository";
import { toMatchResponse } from "./shared";

export class PlayersController {
	constructor(
		private readonly getOwnPlayerUseCase: GetOwnPlayerUseCase,
		private readonly updateOwnPlayerUseCase: UpdateOwnPlayerUseCase,
		private readonly getMatchesUseCase: GetMatchesUseCase,
		private readonly playerRepository: IPlayerRepository,
	) {}

	getOwnPlayer = async (req: Request, res: Response): Promise<void> => {
		const playerId = req.auth?.playerId;
		if (!playerId) {
			res.status(401).json({
				code: "AUTHENTICATION_FAILED",
				message: "Authentication failed.",
			});
			return;
		}

		try {
			const player = await this.getOwnPlayerUseCase.execute(playerId);
			res.status(200).json(player);
		} catch (error) {
			if (error instanceof AuthenticationFailedError) {
				res.status(401).json({
					code: "AUTHENTICATION_FAILED",
					message: "Authentication failed.",
				});
				return;
			}
			throw error;
		}
	};

	getOwnPlayerMatches = async (req: Request, res: Response): Promise<void> => {
		const playerId = req.auth?.playerId;
		if (!playerId) {
			res.status(401).json({
				code: "AUTHENTICATION_FAILED",
				message: "Authentication failed.",
			});
			return;
		}

		const matches = await this.getMatchesUseCase.getMatchesForPlayerAfter(
			playerId,
			new Date(),
		);
		res.status(200).json({
			items: await Promise.all(
				matches.map((match) =>
					toMatchResponse(match, this.playerRepository),
				),
			),
		});
	};

	updateOwnPlayer = async (req: Request, res: Response): Promise<void> => {
		const playerId = req.auth?.playerId;
		if (!playerId) {
			res.status(401).json({
				code: "AUTHENTICATION_FAILED",
				message: "Authentication failed.",
			});
			return;
		}

		try {
			const player = await this.updateOwnPlayerUseCase.execute(
				playerId,
				req.body,
			);
			res.status(200).json(player);
		} catch (error) {
			if (error instanceof InvalidOwnPlayerUpdateError) {
				res.status(400).json({
					code: "INVALID_REQUEST",
					message: error.message,
				});
				return;
			}
			if (error instanceof AuthenticationFailedError) {
				res.status(401).json({
					code: "AUTHENTICATION_FAILED",
					message: "Authentication failed.",
				});
				return;
			}
			if (error instanceof OwnPlayerEmailConflictError) {
				res.status(409).json({
					code: "CONFLICT",
					message: error.message,
				});
				return;
			}
			throw error;
		}
	};
}
