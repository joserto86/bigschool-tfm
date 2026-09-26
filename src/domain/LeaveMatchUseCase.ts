import { MatchRepository } from "../persistence/IMatchRepository";
import { MatchNotFoundError } from "./GetMatchByIdUseCase";

export interface LeaveMatchInput {
	matchId: string;
	playerId: string;
}

export class PlayerNotInMatchError extends Error {
	constructor(playerId: string, matchId: string) {
		super(`Player '${playerId}' is not registered in match '${matchId}'.`);
		this.name = "PlayerNotInMatchError";
	}
}

export class MatchNotOpenError extends Error {
	constructor(matchId: string) {
		super(`Match '${matchId}' is not open for registration.`);
		this.name = "MatchNotOpenError";
	}
}

export class LeaveMatchUseCase {
	constructor(private readonly matchRepository: MatchRepository) {}

	execute(input: LeaveMatchInput): void {
		const { matchId, playerId } = input;
		const match = this.matchRepository.findById(matchId);

		if (!match) {
			throw new MatchNotFoundError(matchId);
		}

		const playerIndex = match.players.findIndex(
			(player) => player.playerId === playerId,
		);

		if (playerIndex === -1) {
			throw new PlayerNotInMatchError(playerId, matchId);
		}

		if (match.status !== "OPEN") {
			throw new MatchNotOpenError(matchId);
		}

		match.players.splice(playerIndex, 1);

		if (match.players.length === 0) {
			this.matchRepository.deleteById(matchId);
		}
	}
}
