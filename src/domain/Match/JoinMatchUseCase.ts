import { IMatchRepository } from "../../persistence/Match/IMatchRepository";
import { MatchNotFoundError } from "./GetMatchByIdUseCase";

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

	execute(input: JoinMatchInput): JoinMatchResult {
		const { matchId, playerId } = input;
		const match = this.matchRepository.findById(matchId);

		if (!match) {
			throw new MatchNotFoundError(matchId);
		}

		if (match.players.some((player) => player.playerId === playerId)) {
			throw new PlayerAlreadyRegisteredError(playerId, matchId);
		}

		if (match.players.length >= 4) {
			throw new MatchFullError(matchId);
		}

		const slot = match.players.length + 1;
		match.players.push({ playerId, slot, confirmation: null });

		if (match.players.length === 4) {
			match.status = "COMPLETED";
		}

		return {
			matchId: match.id,
			playerId,
			slot,
			matchStatus: match.status,
			confirmation: null,
		};
	}
}
