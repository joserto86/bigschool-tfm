import { Request, Response } from "express";
import {
	CreateMatchUseCase,
	InvalidMatchDateTimeError,
} from "../../domain/Match/CreateMatchUseCase";
import {
	GetMatchesByDateTimeUseCase,
	MissingDateTimeQueryError,
} from "../../domain/Match/GetMatchesByDateTimeUseCase";
import {
	GetMatchByIdUseCase,
	MatchNotFoundError,
} from "../../domain/Match/GetMatchByIdUseCase";
import {
	JoinMatchUseCase,
	MatchFullError,
	PlayerAlreadyRegisteredError,
} from "../../domain/Match/JoinMatchUseCase";
import {
	LeaveMatchUseCase,
	MatchNotOpenError,
	PlayerNotInMatchError,
} from "../../domain/Match/LeaveMatchUseCase";
import {
	ConfirmMatchUseCase,
	MatchNotCompletedError,
	PlayerNotInMatchError as PlayerNotInConfirmationError,
} from "../../domain/Match/ConfirmMatchUseCase";

export class MatchesController {
	constructor(
		private readonly createMatchUseCase: CreateMatchUseCase,
		private readonly getMatchesByDateTimeUseCase: GetMatchesByDateTimeUseCase,
		private readonly getMatchByIdUseCase: GetMatchByIdUseCase,
		private readonly joinMatchUseCase: JoinMatchUseCase,
		private readonly leaveMatchUseCase: LeaveMatchUseCase,
		private readonly confirmMatchUseCase: ConfirmMatchUseCase,
	) {}

	createMatch = (req: Request, res: Response): void => {
		try {
			const match = this.createMatchUseCase.execute({
				dateTime: req.body?.dateTime,
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

	getMatches = (req: Request, res: Response): void => {
		try {
			const items = this.getMatchesByDateTimeUseCase.execute({
				dateTime: req.query.dateTime,
			});
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

	getMatchById = (req: Request, res: Response): void => {
		try {
			const match = this.getMatchByIdUseCase.execute({
				matchId: req.params.matchId as string,
			});
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

	joinMatch = (req: Request, res: Response): void => {
		try {
			const result = this.joinMatchUseCase.execute({
				matchId: req.params.matchId as string,
				playerId: req.body?.playerId,
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

	leaveMatch = (req: Request, res: Response): void => {
		try {
			this.leaveMatchUseCase.execute({
				matchId: req.params.matchId as string,
				playerId: req.params.playerId as string,
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

	confirmMatch = (req: Request, res: Response): void => {
		try {
			const result = this.confirmMatchUseCase.execute({
				matchId: req.params.matchId as string,
				playerId: req.body?.playerId,
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
				error instanceof PlayerNotInConfirmationError
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
