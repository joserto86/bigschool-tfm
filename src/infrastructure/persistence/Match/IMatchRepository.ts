import { Match } from "../../../types/match";

export interface IMatchRepository {
	create(match: Match): Promise<Match>;
	findByDateTime(dateTime: string): Promise<Match[]>;
	findById(matchId: string): Promise<Match | undefined>;
	deleteById(matchId: string): Promise<void>;
}
