import { Request, Response } from "express";
import {
	AdminPlayerEmailConflictError,
	AdminPlayerNotFoundError,
	AdminPlayersUseCases,
	InvalidAdminPlayerRequestError,
} from "../../../domain/Admin/AdminPlayersUseCases";

export class AdminPlayersController {
	constructor(private readonly useCases: AdminPlayersUseCases) {}

	listPlayers = async (_req: Request, res: Response): Promise<void> => {
		res.status(200).json(await this.useCases.listPlayers());
	};

	createPlayer = async (req: Request, res: Response): Promise<void> => {
		try {
			const player = await this.useCases.createPlayer(req.body);
			res.status(201).json(player);
		} catch (error) {
			if (this.respondToDomainError(error, res)) return;
			throw error;
		}
	};

	getPlayer = async (
		req: Request<{ playerId: string }>,
		res: Response,
	): Promise<void> => {
		try {
			const player = await this.useCases.getPlayer(req.params.playerId);
			res.status(200).json(player);
		} catch (error) {
			if (this.respondToDomainError(error, res)) return;
			throw error;
		}
	};

	updatePlayer = async (
		req: Request<{ playerId: string }>,
		res: Response,
	): Promise<void> => {
		try {
			const player = await this.useCases.updatePlayer(
				req.params.playerId,
				req.body,
			);
			res.status(200).json(player);
		} catch (error) {
			if (this.respondToDomainError(error, res)) return;
			throw error;
		}
	};

	updatePlayerStatus = async (
		req: Request<{ playerId: string }>,
		res: Response,
	): Promise<void> => {
		try {
			const player = await this.useCases.updatePlayerStatus(
				req.params.playerId,
				req.body,
			);
			res.status(200).json(player);
		} catch (error) {
			if (this.respondToDomainError(error, res)) return;
			throw error;
		}
	};

	deletePlayer = async (
		req: Request<{ playerId: string }>,
		res: Response,
	): Promise<void> => {
		try {
			await this.useCases.deletePlayer(req.params.playerId);
			res.status(204).end();
		} catch (error) {
			if (this.respondToDomainError(error, res)) return;
			throw error;
		}
	};

	private respondToDomainError(error: unknown, res: Response): boolean {
		if (error instanceof InvalidAdminPlayerRequestError) {
			res.status(400).json({
				code: "INVALID_REQUEST",
				message: error.message,
			});
			return true;
		}
		if (error instanceof AdminPlayerNotFoundError) {
			res.status(404).json({
				code: "PLAYER_NOT_FOUND",
				message: error.message,
			});
			return true;
		}
		if (error instanceof AdminPlayerEmailConflictError) {
			res.status(409).json({
				code: "CONFLICT",
				message: error.message,
			});
			return true;
		}
		return false;
	}
}
