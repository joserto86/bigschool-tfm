import { Request, Response } from "express";
import { CreateMatchUseCase } from "../../../domain/Match/CreateMatchUseCase";
import { GetMatchesUseCase } from "../../../domain/Match/GetMatchesUseCase";
import {
	JoinMatchUseCase,
	MatchFullError,
	PlayerAlreadyRegisteredError,
} from "../../../domain/Match/JoinMatchUseCase";
import { LeaveMatchUseCase } from "../../../domain/Match/LeaveMatchUseCase";
import { ConfirmMatchUseCase } from "../../../domain/Match/ConfirmMatchUseCase";
import { InvalidMatchDateTimeError, MatchNotCompletedError, MatchNotFoundError, MatchNotOpenError, MissingDateTimeQueryError, PlayerNotInMatchError } from "../../../domain/Match/error/error";

export class MatchesController {
	constructor(
		private readonly createMatchUseCase: CreateMatchUseCase,
		private readonly getMatchesUseCase: GetMatchesUseCase,
		private readonly joinMatchUseCase: JoinMatchUseCase,
		private readonly leaveMatchUseCase: LeaveMatchUseCase,
		private readonly confirmMatchUseCase: ConfirmMatchUseCase,
	) {}

	createMatch = async (req: Request, res: Response): Promise<void> => {
		try {
			const match = await this.createMatchUseCase.execute({
				dateTime: req.body?.dateTime,
				playerId: req.auth?.playerId as string,
			});
			res.status(201).json(match);
		} catch (error) {
			if (error instanceof InvalidMatchDateTimeError) {
				res.status(400).json({
					code: "INVALID_REQUEST",
					message: error.message,
				});
				return;
			}
			throw error;
		}
	};

	getMatches = async (req: Request, res: Response): Promise<void> => {
		try {
			const items = await this.getMatchesUseCase.getMatchesByDateTime(
				req.query.dateTime as string,
			);
			res.status(200).json({ items });
		} catch (error) {
			if (error instanceof MissingDateTimeQueryError) {
				res.status(400).json({
					code: "INVALID_REQUEST",
					message: error.message,
				});
				return;
			}
			throw error;
		}
	};

	getMatchById = async (req: Request, res: Response): Promise<void> => {
		try {
			const match = await this.getMatchesUseCase.getMatch(req.params.matchId as string);
			res.status(200).json(match);
		} catch (error) {
			if (error instanceof MatchNotFoundError) {
				res.status(404).json({
					code: "MATCH_NOT_FOUND",
					message: error.message,
				});
				return;
			}
			throw error;
		}
	};

	joinMatch = async (req: Request, res: Response): Promise<void> => {
		try {
			const result = await this.joinMatchUseCase.execute({
				matchId: req.params.matchId as string,
				playerId: req.auth?.playerId as string,
			});
			res.status(201).json(result);
		} catch (error) {
			if (error instanceof MatchNotFoundError) {
				res.status(404).json({
					code: "MATCH_NOT_FOUND",
					message: error.message,
				});
				return;
			}
			if (error instanceof PlayerAlreadyRegisteredError) {
				res.status(409).json({
					code: "PLAYER_ALREADY_REGISTERED",
					message: error.message,
				});
				return;
			}
			if (error instanceof MatchFullError) {
				res.status(409).json({
					code: "MATCH_FULL",
					message: error.message,
				});
				return;
			}
			throw error;
		}
	};

	leaveMatch = async (req: Request, res: Response): Promise<void> => {
		try {
			await this.leaveMatchUseCase.execute({
				matchId: req.params.matchId as string,
				playerId: req.auth?.playerId as string,
			});
			res.status(204).send();
		} catch (error) {
			if (
				error instanceof MatchNotFoundError ||
				error instanceof PlayerNotInMatchError
			) {
				res.status(404).json({
					code: "MATCH_NOT_FOUND",
					message: error.message,
				});
				return;
			}
			if (error instanceof MatchNotOpenError) {
				res.status(409).json({
					code: "MATCH_NOT_OPEN",
					message: error.message,
				});
				return;
			}
			throw error;
		}
	};

	confirmMatch = async (req: Request, res: Response): Promise<void> => {
		try {
			const result = await this.confirmMatchUseCase.execute({
				matchId: req.params.matchId as string,
				playerId: req.auth?.playerId as string,
				decision: req.body?.decision,
			});
			res.status(200).json(result);
		} catch (error) {
			if (error instanceof MatchNotFoundError) {
				res.status(404).json({
					code: "MATCH_NOT_FOUND",
					message: error.message,
				});
				return;
			}
			if (
				error instanceof MatchNotCompletedError ||
				error instanceof PlayerNotInMatchError
			) {
				res.status(409).json({
					code: "MATCH_NOT_COMPLETED",
					message: error.message,
				});
				return;
			}
			throw error;
		}
	};
}
