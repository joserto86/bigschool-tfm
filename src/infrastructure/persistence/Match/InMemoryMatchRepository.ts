import { Match, MatchListOptions } from "../../../types/match";
import { IMatchRepository } from "./IMatchRepository";

export class InMemoryMatchRepository implements IMatchRepository {
	private matches: Match[] = [];

	async create(match: Match): Promise<Match> {
		this.matches.push(match);
		return match;
	}

	async update(match: Match): Promise<Match> { 
		this.matches = this.matches.map((m) => (m.id === match.id ? match : m));
		return match;
	}

	async list(options: MatchListOptions = {}): Promise<Match[]> {
		const sortOrder = options.sortOrder ?? "asc";
		const direction = sortOrder === "asc" ? 1 : -1;

		return this.matches
			.filter((match) => {
				const dateTime = new Date(match.dateTime);
				return (
					(options.from === undefined || dateTime >= options.from) &&
					(options.to === undefined || dateTime <= options.to) &&
					(options.status === undefined || match.status === options.status) &&
					(options.playerId === undefined ||
						match.players.some((player) => player.playerId === options.playerId))
				);
			})
			.slice()
			.sort((left, right) => {
				const difference =
					new Date(left.dateTime).getTime() - new Date(right.dateTime).getTime();
				return difference === 0
					? direction * left.id.localeCompare(right.id)
					: direction * difference;
			});
	}

	async findByPlayerIdAfterDateTime(
		playerId: string,
		dateTime: Date,
	): Promise<Match[]> {
		return this.matches.filter(
			(match) =>
				new Date(match.dateTime).getTime() > dateTime.getTime() &&
				match.players.some((player) => player.playerId === playerId),
		);
	}

	async findById(matchId: string): Promise<Match | undefined> {
		return this.matches.find((match) => match.id === matchId);
	}

	async deleteById(matchId: string): Promise<void> {
		const index = this.matches.findIndex((match) => match.id === matchId);
		if (index !== -1) {
			this.matches.splice(index, 1);
		}
	}
}
