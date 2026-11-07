import { MatchPlayer } from "../../../types/match";

export interface CreateMatchInputDto {
	dateTime: string;
	playerId?: string;
	place?: string | null;
	players?: MatchPlayer[];
}
