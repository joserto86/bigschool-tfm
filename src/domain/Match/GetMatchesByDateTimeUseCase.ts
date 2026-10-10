import { Match } from "../../types/match";
import { IMatchRepository } from "../../infrastructure/persistence/Match/IMatchRepository";

export interface GetMatchesByDateTimeInput {
	dateTime: unknown;
}

export class MissingDateTimeQueryError extends Error {
	constructor() {
		super("The request is invalid.");
		this.name = "MissingDateTimeQueryError";
	}
}

export class GetMatchesByDateTimeUseCase {
	constructor(private readonly matchRepository: IMatchRepository) {}

	async execute(input: GetMatchesByDateTimeInput): Promise<Match[]> {
		const { dateTime } = input;

		if (typeof dateTime !== "string" || dateTime.trim() === "") {
			throw new MissingDateTimeQueryError();
		}

		return this.matchRepository.findByDateTime(dateTime);
	}
}
