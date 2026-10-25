export interface ConfirmMatchInputDto {
	matchId: string;
	playerId: string;
	decision: "CONFIRMED" | "DECLINED";
}
