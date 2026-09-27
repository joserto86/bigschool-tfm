import { randomUUID } from "crypto";
import { Match } from "../../types/match";
import { MatchRepository } from "../../persistence/Match/IMatchRepository";

export interface CreateMatchInput {
	dateTime: unknown;
}

export class InvalidMatchDateTimeError extends Error {
	constructor() {
		super("The request is invalid.");
		this.name = "InvalidMatchDateTimeError";
	}
}

export class CreateMatchUseCase {
	constructor(private readonly matchRepository: MatchRepository) {}

	execute(input: CreateMatchInput): Match {
		const { dateTime } = input;

		if (typeof dateTime !== "string" || dateTime.trim() === "") {
			throw new InvalidMatchDateTimeError();
		}

		const match: Match = {
			id: randomUUID(),
			dateTime,
			status: "OPEN",
			players: [],
		};

		return this.matchRepository.create(match);
	}
}
