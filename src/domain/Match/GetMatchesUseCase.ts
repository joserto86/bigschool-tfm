import { Match } from "../../types/match";
import { IMatchRepository } from "../../infrastructure/persistence/Match/IMatchRepository";

export interface GetMatchByIdInput {
	matchId: string;
}

export class MatchNotFoundError extends Error {
	constructor(matchId: string) {
		super(`Match '${matchId}' was not found.`);
		this.name = "MatchNotFoundError";
	}
}

export interface GetMatchesByDateTimeInput {
	dateTime: Date;
}

export class MissingDateTimeQueryError extends Error {
	constructor() {
		super("The request is invalid.");
		this.name = "MissingDateTimeQueryError";
	}
}

export class GetMatchesUseCase {
	constructor(private readonly matchRepository: IMatchRepository) {}

	async getMatch(matchId: string): Promise<Match> {
		const match = await this.matchRepository.findById(matchId);
		if (!match) {
			throw new MatchNotFoundError(matchId);
		}
		return match;
	}

		async getMatchesByDateTime(input: GetMatchesByDateTimeInput): Promise<Match[]> {
		const { dateTime } = input;

		if (typeof dateTime !== "string" || dateTime.trim() === "") {
			throw new MissingDateTimeQueryError();
		}

		return this.matchRepository.findByDateTime(dateTime);
	}
}
