import { Match } from "../../types/match";

export interface IMatchRepository {
	create(match: Match): Match;
	findByDateTime(dateTime: string): Match[];
	findById(matchId: string): Match | undefined;
	deleteById(matchId: string): void;
}
