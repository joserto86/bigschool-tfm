import { MatchRepository } from "../../persistence/Match/IMatchRepository";
import { MatchNotFoundError } from "./GetMatchByIdUseCase";

export interface ConfirmMatchInput {
	matchId: string;
	playerId: string;
	decision: "CONFIRMED" | "DECLINED";
}

export interface ConfirmMatchResult {
	matchId: string;
	playerId: string;
	decision: "CONFIRMED" | "DECLINED";
	matchStatus: string;
}

export class MatchNotCompletedError extends Error {
	constructor(matchId: string) {
		super(`Match '${matchId}' is not completed.`);
		this.name = "MatchNotCompletedError";
	}
}

export class PlayerNotInMatchError extends Error {
	constructor(playerId: string, matchId: string) {
		super(`Player '${playerId}' is not registered in match '${matchId}'.`);
		this.name = "PlayerNotInMatchError";
	}
}

export class ConfirmMatchUseCase {
	constructor(private readonly matchRepository: MatchRepository) {}

	execute(input: ConfirmMatchInput): ConfirmMatchResult {
		const { matchId, playerId, decision } = input;
		const match = this.matchRepository.findById(matchId);

		if (!match) {
			throw new MatchNotFoundError(matchId);
		}

		if (match.status !== "COMPLETED") {
			throw new MatchNotCompletedError(matchId);
		}

		const player = match.players.find((p) => p.playerId === playerId);

		if (!player) {
			throw new PlayerNotInMatchError(playerId, matchId);
		}

		player.confirmation = decision;

		if (decision === "DECLINED") {
			match.status = "CANCELLED";
		} else if (match.players.every((p) => p.confirmation === "CONFIRMED")) {
			match.status = "CONFIRMED";
		}

		return {
			matchId: match.id,
			playerId,
			decision,
			matchStatus: match.status,
		};
	}
}
