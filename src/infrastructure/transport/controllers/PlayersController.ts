import { Request, Response } from "express";
import { AuthenticationFailedError } from "../../../domain/Auth/LoginUseCase";
import {
	GetOwnPlayerUseCase,
	InvalidOwnPlayerUpdateError,
	OwnPlayerEmailConflictError,
	UpdateOwnPlayerUseCase,
} from "../../../domain/Player/OwnPlayerUseCases";

export class PlayersController {
	constructor(
		private readonly getOwnPlayerUseCase: GetOwnPlayerUseCase,
		private readonly updateOwnPlayerUseCase: UpdateOwnPlayerUseCase,
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
