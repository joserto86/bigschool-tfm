import { randomUUID } from "crypto";
import { Match } from "../../types/match";
import { IMatchRepository } from "../../infrastructure/persistence/Match/IMatchRepository";
import { CreateMatchInputDto } from "./dto/CreateMatchInputDto";
import {
	InvalidMatchDateTimeError,
	PlayerAlreadyScheduledError,
} from "./error";

export class CreateMatchUseCase {
	constructor(private readonly matchRepository: IMatchRepository) {}

	async execute(input: CreateMatchInputDto): Promise<Match> {
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

		if (playerId) {
			const matches = await this.matchRepository.list();
			const alreadyScheduled = matches.some(
				(match) =>
					new Date(match.dateTime).getTime() === parsedDateTime.getTime() &&
					match.players.some((player) => player.playerId === playerId),
			);
			if (alreadyScheduled) {
				throw new PlayerAlreadyScheduledError(playerId, dateTime);
			}
		}

		const players =
			input.players ??
			(playerId ? [{ playerId, slot: 1, confirmation: null }] : []);
		const match: Match = {
			id: randomUUID(),
			dateTime,
			status:
				players.length === 4 &&
				players.every((player) => player.confirmation === "CONFIRMED")
					? "COMPLETED"
					: "OPEN",
			place: input.place ?? null,
			players,
			createdAt: new Date(),
			updatedAt: null,
		};

		return this.matchRepository.create(match);
		// return toMatchResponse(await this.matchRepository.create(match));
	}
}
