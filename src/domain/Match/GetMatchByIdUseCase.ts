import { Match } from "../../types/match";
import { IMatchRepository } from "../../persistence/Match/IMatchRepository";

export interface GetMatchByIdInput {
	matchId: string;
}

export class MatchNotFoundError extends Error {
	constructor(matchId: string) {
		super(`Match '${matchId}' was not found.`);
		this.name = "MatchNotFoundError";
	}
}

export class GetMatchByIdUseCase {
	constructor(private readonly matchRepository: IMatchRepository) {}

	execute(input: GetMatchByIdInput): Match {
		const match = this.matchRepository.findById(input.matchId);

		if (!match) {
			throw new MatchNotFoundError(input.matchId);
		}

		return match;
	}
}
