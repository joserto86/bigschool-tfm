import { Request, Response } from "express";
import {
	AdminMatchFullError,
	AdminMatchPlayerAlreadyRegisteredError,
	AdminMatchPlayerNotFoundError,
	AdminMatchPlayerNotRegisteredError,
	AdminMatchPlayerRemovalNotAllowedError,
	AdminMatchRequiresFourPlayersError,
	InvalidAdminMatchRequestError,
	InvalidAdminMatchTransitionError,
} from "../../../domain/Admin/error/MatchError";
import { AdminMatchesUseCases } from "../../../domain/Admin/AdminMatchesUseCases";
import {
	InvalidMatchDateTimeError,
	MatchNotFoundError,
	MatchNotOpenError,
} from "../../../domain/Match/error/error";

export class AdminMatchesController {
	constructor(private readonly useCases: AdminMatchesUseCases) {}

	listMatches = async (_req: Request, res: Response): Promise<void> => {
		res.status(200).json({ items: await this.useCases.listMatches() });
	};

	createMatch = async (req: Request, res: Response): Promise<void> => {
		try {
			const match = await this.useCases.createMatch(req.body);
			res.status(201).json(match);
		} catch (error) {
			if (
				error instanceof InvalidAdminMatchRequestError ||
				error instanceof InvalidMatchDateTimeError
			) {
				res
					.status(400)
					.json({ code: "INVALID_REQUEST", message: error.message });
				return;
			}
			throw error;
		}
	};

	getMatch = async (
		req: Request<{ matchId: string }>,
		res: Response,
	): Promise<void> => {
		try {
			res.status(200).json(await this.useCases.getMatch(req.params.matchId));
		} catch (error) {
			if (this.respondToDomainError(error, res)) return;
			throw error;
		}
	};

	deleteMatch = async (
		req: Request<{ matchId: string }>,
		res: Response,
	): Promise<void> => {
		try {
			await this.useCases.deleteMatch(req.params.matchId);
			res.status(204).end();
		} catch (error) {
			if (this.respondToDomainError(error, res)) return;
			throw error;
		}
	};

	addPlayer = async (
		req: Request<{ matchId: string }>,
		res: Response,
	): Promise<void> => {
		try {
			const match = await this.useCases.addPlayer(req.params.matchId, req.body);
			res.status(201).json(match);
		} catch (error) {
			if (this.respondToDomainError(error, res)) return;
			throw error;
		}
	};

	removePlayer = async (
		req: Request<{ matchId: string; playerId: string }>,
		res: Response,
	): Promise<void> => {
		try {
			const match = await this.useCases.removePlayer(
				req.params.matchId,
				req.params.playerId,
			);
			res.status(200).json(match);
		} catch (error) {
			if (this.respondToDomainError(error, res)) return;
			throw error;
		}
	};

	updateStatus = async (
		req: Request<{ matchId: string }>,
		res: Response,
	): Promise<void> => {
		try {
			const match = await this.useCases.updateStatus(
				req.params.matchId,
				req.body,
			);
			res.status(200).json(match);
		} catch (error) {
			if (this.respondToDomainError(error, res)) return;
			throw error;
		}
	};

	private respondToDomainError(error: unknown, res: Response): boolean {
		if (error instanceof InvalidAdminMatchRequestError) {
			res.status(400).json({ code: "INVALID_REQUEST", message: error.message });
			return true;
		}
		if (error instanceof MatchNotFoundError) {
			res.status(404).json({ code: "MATCH_NOT_FOUND", message: error.message });
			return true;
		}
		if (error instanceof AdminMatchPlayerNotFoundError) {
			res
				.status(404)
				.json({ code: "PLAYER_NOT_FOUND", message: error.message });
			return true;
		}
		if (error instanceof AdminMatchPlayerNotRegisteredError) {
			res
				.status(404)
				.json({ code: "PLAYER_NOT_IN_MATCH", message: error.message });
			return true;
		}
		if (error instanceof AdminMatchPlayerAlreadyRegisteredError) {
			res
				.status(409)
				.json({ code: "PLAYER_ALREADY_REGISTERED", message: error.message });
			return true;
		}
		if (error instanceof AdminMatchFullError) {
			res.status(409).json({ code: "MATCH_FULL", message: error.message });
			return true;
		}
		if (error instanceof MatchNotOpenError) {
			res.status(409).json({ code: "MATCH_NOT_OPEN", message: error.message });
			return true;
		}
		if (error instanceof AdminMatchRequiresFourPlayersError) {
			res.status(409).json({
				code: "MATCH_REQUIRES_FOUR_PLAYERS",
				message: error.message,
			});
			return true;
		}
		if (error instanceof AdminMatchPlayerRemovalNotAllowedError) {
			res.status(409).json({ code: "MATCH_IMMUTABLE", message: error.message });
			return true;
		}
		if (error instanceof InvalidAdminMatchTransitionError) {
			res.status(409).json({
				code: "INVALID_MATCH_TRANSITION",
				message: error.message,
			});
			return true;
		}
		return false;
	}
}
