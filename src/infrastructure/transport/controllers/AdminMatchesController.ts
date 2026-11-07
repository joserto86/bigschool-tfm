import { Request, Response } from "express";
import {
	AdminMatchDuplicatePlayerError,
	AdminMatchPlayerAlreadyRegisteredError,
	AdminMatchPlayerNotFoundError,
	AdminMatchPlayerRemovalNotAllowedError,
	AdminMatchRequiresFourPlayersError,
	AdminMatchSlotAlreadyUsedError,
	InvalidAdminMatchRequestError,
	InvalidAdminMatchTransitionError,
} from "../../../domain/Admin/error/MatchError";
import { AdminMatchesUseCases } from "../../../domain/Admin/AdminMatchesUseCases";
import {
	InvalidMatchListQueryError,
	InvalidMatchDateTimeError,
	MatchNotFoundError,
} from "../../../domain/Match/error";
import { IPlayerRepository } from "../../persistence/Player/IPlayerRepository";
import { toMatchResponse } from "./shared";

export class AdminMatchesController {
	constructor(
		private readonly useCases: AdminMatchesUseCases,
		private readonly playerRepository: IPlayerRepository,
	) {}

	listMatches = async (req: Request, res: Response): Promise<void> => {
		try {
			const matches = await this.useCases.listMatches(req.query);
			res.status(200).json({
				items: await Promise.all(
					matches.map((match) => toMatchResponse(match, this.playerRepository)),
				),
			});
		} catch (error) {
			if (this.respondToDomainError(error, res)) return;
			throw error;
		}
	};

	createMatch = async (req: Request, res: Response): Promise<void> => {
		try {
			const match = await this.useCases.createMatch(req.body);
			res
				.status(201)
				.json(await toMatchResponse(match, this.playerRepository));
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
			if (this.respondToDomainError(error, res)) return;
			throw error;
		}
	};

	getMatch = async (
		req: Request<{ matchId: string }>,
		res: Response,
	): Promise<void> => {
		try {
			const match = await this.useCases.getMatch(req.params.matchId);
			res
				.status(200)
				.json(await toMatchResponse(match, this.playerRepository));
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

	replaceMatch = async (
		req: Request<{ matchId: string }>,
		res: Response,
	): Promise<void> => {
		try {
			const match = await this.useCases.replaceMatch(
				req.params.matchId,
				req.body,
			);
			res
				.status(200)
				.json(await toMatchResponse(match, this.playerRepository));
		} catch (error) {
			if (this.respondToDomainError(error, res)) return;
			throw error;
		}
	};

	patchMatch = async (
		req: Request<{ matchId: string }>,
		res: Response,
	): Promise<void> => {
		try {
			const match = await this.useCases.patchMatch(
				req.params.matchId,
				req.body,
			);
			res
				.status(200)
				.json(await toMatchResponse(match, this.playerRepository));
		} catch (error) {
			if (this.respondToDomainError(error, res)) return;
			throw error;
		}
	};

	private respondToDomainError(error: unknown, res: Response): boolean {
		if (
			error instanceof InvalidAdminMatchRequestError ||
			error instanceof InvalidMatchListQueryError
		) {
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
		if (
			error instanceof AdminMatchPlayerAlreadyRegisteredError ||
			error instanceof AdminMatchDuplicatePlayerError
		) {
			res
				.status(409)
				.json({ code: "PLAYER_ALREADY_REGISTERED", message: error.message });
			return true;
		}
		if (error instanceof AdminMatchSlotAlreadyUsedError) {
			res.status(409).json({ code: "MATCH_SLOT_CONFLICT", message: error.message });
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
