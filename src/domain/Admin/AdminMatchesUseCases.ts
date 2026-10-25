import { z } from "zod";
import { CreateMatchUseCase } from "../Match/CreateMatchUseCase";
import { GetMatchesUseCase } from "../Match/GetMatchesUseCase";
import { IMatchRepository } from "../../infrastructure/persistence/Match/IMatchRepository";
import { IPlayerRepository } from "../../infrastructure/persistence/Player/IPlayerRepository";
import { Match, MatchStatus } from "../../types/match";
import {
	AdminMatchFullError,
	AdminMatchPlayerAlreadyRegisteredError,
	AdminMatchPlayerNotFoundError,
	AdminMatchPlayerNotRegisteredError,
	AdminMatchPlayerRemovalNotAllowedError,
	AdminMatchRequiresFourPlayersError,
	InvalidAdminMatchRequestError,
	InvalidAdminMatchTransitionError,
} from "./error/MatchError";
import { MatchNotOpenError } from "../Match/error/error";
import { FULL_MATCH_PLAYER_COUNT } from "../Match/Constants";

const createMatchSchema = z
	.object({
		dateTime: z.iso.datetime({ offset: true }),
	})
	.strict();

const addPlayerSchema = z.object({ playerId: z.string().min(1) }).strict();

const updateStatusSchema = z
	.object({
		status: z.enum(["COMPLETED", "CONFIRMED", "CANCELLED"]),
	})
	.strict();
export class AdminMatchesUseCases {
	private readonly createMatchUseCase: CreateMatchUseCase;
	private readonly getMatchUseCase: GetMatchesUseCase;

	constructor(
		private readonly matchRepository: IMatchRepository,
		private readonly playerRepository: IPlayerRepository,
	) {
		this.createMatchUseCase = new CreateMatchUseCase(matchRepository);
		this.getMatchUseCase = new GetMatchesUseCase(matchRepository);
	}

	async listMatches(): Promise<Match[]> {
		return this.matchRepository.list();
	}

	async createMatch(input: unknown): Promise<Match> {
		const parsed = createMatchSchema.safeParse(input);
		if (!parsed.success) {
			throw new InvalidAdminMatchRequestError();
		}

		return this.createMatchUseCase.execute({ dateTime: parsed.data.dateTime });
	}

	async getMatch(matchId: string): Promise<Match> {
		return this.getMatchUseCase.getMatch(matchId);
	}

	async deleteMatch(matchId: string): Promise<void> {
		await this.getMatch(matchId);
		await this.matchRepository.deleteById(matchId);
	}

	async addPlayer(matchId: string, input: unknown): Promise<Match> {
		const parsed = addPlayerSchema.safeParse(input);
		if (!parsed.success) {
			throw new InvalidAdminMatchRequestError();
		}

		const match = await this.getMatch(matchId);
		const player = await this.playerRepository.findById(parsed.data.playerId);
		if (!player) {
			throw new AdminMatchPlayerNotFoundError(parsed.data.playerId);
		}
		if (match.status !== "OPEN") {
			throw new MatchNotOpenError(matchId);
		}
		if (
			match.players.some(({ playerId }) => playerId === parsed.data.playerId)
		) {
			throw new AdminMatchPlayerAlreadyRegisteredError(
				parsed.data.playerId,
				matchId,
			);
		}
		if (match.players.length >= FULL_MATCH_PLAYER_COUNT) {
			throw new AdminMatchFullError(matchId);
		}

		const occupiedSlots = new Set(match.players.map(({ slot }) => slot));
		const slot = Array.from(
			{ length: FULL_MATCH_PLAYER_COUNT },
			(_, index) => index + 1,
		).find((candidate) => !occupiedSlots.has(candidate));
		if (slot === undefined) {
			throw new AdminMatchFullError(matchId);
		}

		match.players.push({
			playerId: parsed.data.playerId,
			slot,
			confirmation: null,
		});
		if (match.players.length === FULL_MATCH_PLAYER_COUNT) {
			match.status = "COMPLETED";
		}
		match.updatedAt = new Date();

		return this.matchRepository.update(match);
	}

	async removePlayer(matchId: string, playerId: string): Promise<Match> {
		const match = await this.getMatch(matchId);
		const playerIndex = match.players.findIndex(
			(player) => player.playerId === playerId,
		);
		if (playerIndex === -1) {
			throw new AdminMatchPlayerNotRegisteredError(playerId, matchId);
		}
		if (match.status === "CONFIRMED" || match.status === "CANCELLED") {
			throw new AdminMatchPlayerRemovalNotAllowedError();
		}

		match.players.splice(playerIndex, 1);
		match.players.forEach((player) => {
			player.confirmation = null;
		});
		match.status = "OPEN";
		match.updatedAt = new Date();

		return this.matchRepository.update(match);
	}

	async updateStatus(matchId: string, input: unknown): Promise<Match> {
		const parsed = updateStatusSchema.safeParse(input);
		if (!parsed.success) {
			throw new InvalidAdminMatchRequestError();
		}

		const match = await this.getMatch(matchId);
		const nextStatus = parsed.data.status;
		const allowedTransitions: Record<MatchStatus, MatchStatus[]> = {
			OPEN: ["COMPLETED", "CANCELLED"],
			COMPLETED: ["CONFIRMED", "CANCELLED"],
			CONFIRMED: ["CANCELLED", "COMPLETED"],
			CANCELLED: ["COMPLETED"],
		};
		if (!allowedTransitions[match.status].includes(nextStatus)) {
			throw new InvalidAdminMatchTransitionError(match.status, nextStatus);
		}
		if (
			nextStatus === "COMPLETED" &&
			match.players.length !== FULL_MATCH_PLAYER_COUNT
		) {
			throw new AdminMatchRequiresFourPlayersError();
		}

		match.status = nextStatus;
		match.updatedAt = new Date();
		return this.matchRepository.update(match);
	}
}
