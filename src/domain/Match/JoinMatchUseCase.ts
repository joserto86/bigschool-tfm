import { IMatchRepository } from "../../infrastructure/persistence/Match/IMatchRepository";
import { MatchNotFoundError } from "./GetMatchesUseCase";

export interface JoinMatchInput {
	matchId: string;
	playerId: string;
}

export interface JoinMatchResult {
	matchId: string;
	playerId: string;
	slot: number;
	matchStatus: string;
	confirmation: null;
}

export class PlayerAlreadyRegisteredError extends Error {
	constructor(playerId: string, matchId: string) {
		super(`Player '${playerId}' is already registered in match '${matchId}'.`);
		this.name = "PlayerAlreadyRegisteredError";
	}
}

export class MatchFullError extends Error {
	constructor(matchId: string) {
		super(`Match '${matchId}' already has 4 players.`);
		this.name = "MatchFullError";
	}
}

export class JoinMatchUseCase {
	constructor(private readonly matchRepository: IMatchRepository) {}

	async execute(input: JoinMatchInput): Promise<JoinMatchResult> {
		const FULL_MATCH_PLAYER_COUNT = 4;

		const { matchId, playerId } = input;
		const match = await this.matchRepository.findById(matchId);

		if (!match) {
			throw new MatchNotFoundError(matchId);
		}

		if (match.players.some((player) => player.playerId === playerId)) {
			throw new PlayerAlreadyRegisteredError(playerId, matchId);
		}

		if (match.players.length >= FULL_MATCH_PLAYER_COUNT) {
			throw new MatchFullError(matchId);
		}

		const slot = match.players.length + 1;
		match.players.push({ playerId, slot, confirmation: null });
		match.updatedAt = new Date();

		if (match.players.length === FULL_MATCH_PLAYER_COUNT) {
			match.status = "COMPLETED";
		}

		const result = await this.matchRepository.update(match);

		return {
			matchId: result.id,
			playerId,
			slot,
			matchStatus: result.status,
			confirmation: null,
		};
	}
}
