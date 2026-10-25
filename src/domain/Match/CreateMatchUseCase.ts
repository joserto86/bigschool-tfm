import { randomUUID } from "crypto";
import { Match } from "../../types/match";
import { IMatchRepository } from "../../infrastructure/persistence/Match/IMatchRepository";

export interface CreateMatchInput {
	dateTime: string;
	playerId?: string;
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
		const { dateTime, playerId } = input;

		if (typeof dateTime !== "string" || dateTime.trim() === "") {
			throw new InvalidMatchDateTimeError();
		}

		const parsedDateTime = new Date(dateTime);
		if (
			Number.isNaN(parsedDateTime.getTime()) ||
			parsedDateTime.getTime() <= Date.now()
		) {
			throw new InvalidMatchDateTimeError();
		}

		const match: Match = {
			id: randomUUID(),
			dateTime,
			status: "OPEN",
			players: playerId
				? [{ playerId, slot: 1, confirmation: null }]
				: [],
			createdAt: new Date(),
			updatedAt: null,
		};

		return this.matchRepository.create(match);
	}
}
