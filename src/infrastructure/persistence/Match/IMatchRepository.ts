import { Match, MatchListOptions } from "../../../types/match";

export interface IMatchRepository {
	create(match: Match): Promise<Match>;
	update(match: Match): Promise<Match>;
	list(options?: MatchListOptions): Promise<Match[]>;
	findByPlayerIdAfterDateTime(playerId: string, dateTime: Date): Promise<Match[]>;
	findById(matchId: string): Promise<Match | undefined>;
	deleteById(matchId: string): Promise<void>;
}
