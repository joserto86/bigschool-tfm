import { Match } from "../../types/match";
import { IMatchRepository } from "./IMatchRepository";

export class InMemoryMatchRepository implements IMatchRepository {
	private readonly matches: Match[] = [];

	create(match: Match): Match {
		this.matches.push(match);
		return match;
	}

	findByDateTime(dateTime: string): Match[] {
		return this.matches.filter((match) => match.dateTime === dateTime);
	}

	findById(matchId: string): Match | undefined {
		return this.matches.find((match) => match.id === matchId);
	}

	deleteById(matchId: string): void {
		const index = this.matches.findIndex((match) => match.id === matchId);
		if (index !== -1) {
			this.matches.splice(index, 1);
		}
	}
}
