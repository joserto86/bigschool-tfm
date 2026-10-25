export interface ConfirmMatchResultDto {
	matchId: string;
	playerId: string;
	decision: "CONFIRMED" | "DECLINED";
	matchStatus: string;
}
