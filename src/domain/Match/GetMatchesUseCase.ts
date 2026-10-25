import { Match } from "../../types/match";
import { IMatchRepository } from "../../infrastructure/persistence/Match/IMatchRepository";
import { MatchNotFoundError, MissingDateTimeQueryError } from "./error/error";

export class GetMatchesUseCase {
	constructor(private readonly matchRepository: IMatchRepository) {}

	async getMatch(matchId: string): Promise<Match> {
		const match = await this.matchRepository.findById(matchId);
		if (!match) {
			throw new MatchNotFoundError(matchId);
		}
		return match;
	}

	async getMatchesByDateTime(dateTime: string): Promise<Match[]> {
		if (typeof dateTime !== "string" || dateTime.trim() === "") {
			throw new MissingDateTimeQueryError();
		}

		return this.matchRepository.findByDateTime(dateTime);
	}
}
