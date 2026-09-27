import { Match } from "../../types/match";

export interface MatchRepository {
	create(match: Match): Match;
	findByDateTime(dateTime: string): Match[];
	findById(matchId: string): Match | undefined;
	deleteById(matchId: string): void;
}
