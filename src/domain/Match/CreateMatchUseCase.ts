import { randomUUID } from "crypto";
import { Match } from "../../types/match";
import { IMatchRepository } from "../../infrastructure/persistence/Match/IMatchRepository";

export interface CreateMatchInput {
	dateTime: string;
}

export class InvalidMatchDateTimeError extends Error {
	constructor() {
		super("The request is invalid.");
		this.name = "InvalidMatchDateTimeError";
	}
}

export class CreateMatchUseCase {
	constructor(private readonly matchRepository: IMatchRepository) {}

	async execute(input: CreateMatchInput): Promise<Match> {
		const { dateTime } = input;

		if (typeof dateTime !== "string" || dateTime.trim() === "") {
			throw new InvalidMatchDateTimeError();
		}

		if (new Date(dateTime) <= new Date()) {
			console.log("Invalid dateTime:", dateTime, "Current time:", new Date().toISOString());
			throw new InvalidMatchDateTimeError();
		}

		const match: Match = {
			id: randomUUID(),
			dateTime,
			status: "OPEN",
			players: [],
			createdAt: new Date(),
			updatedAt: null,
		};

		return this.matchRepository.create(match);
	}
}
