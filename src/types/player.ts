export interface Player extends PlayerProfile {
	passwordHash: string;
	isAdmin: boolean;
	active: boolean;
}

export interface PlayerProfile {
	id: string;
	name: string;
	email: string;
	phone: string | null;
	createdAt: Date;
	updatedAt: Date | null;
}
export interface PlayerProfileUpdate {
	name?: string;
	email?: string;
	phone?: string;
}

export type PlayerProfileUpdateResult =
	| { status: "updated"; player: Player }
	| { status: "not-found" }
	| { status: "email-conflict" };
