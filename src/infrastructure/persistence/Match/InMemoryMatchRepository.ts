import { Match } from "../../../types/match";
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

	async list(): Promise<Match[]> {
		return [...this.matches];
	}

	async findByDateTime(dateTime: string): Promise<Match[]> {
		return this.matches.filter((match) => match.dateTime === dateTime);
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
