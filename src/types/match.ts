export type MatchStatus = "OPEN" | "COMPLETED" | "CONFIRMED" | "CANCELLED";

export type ConfirmationStatus = "PENDING" | "CONFIRMED" | "DECLINED";

export interface MatchPlayer {
	playerId: string;
	slot: number;
	confirmation: ConfirmationStatus | null;
}

export interface Match {
	id: string;
	dateTime: string;
	status: MatchStatus;
	players: MatchPlayer[];
	place?: string | null;
	createdAt: Date;
	updatedAt?: Date | null;
}

export interface MatchListOptions {
	from?: Date;
	to?: Date;
	playerId?: string;
	status?: MatchStatus;
	sortBy?: "createdAt" | "updatedAt";
	sortOrder?: "asc" | "desc";
}
