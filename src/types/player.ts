export type PlayerPosition = "left" | "right";

export interface PlayerProfile {
	id: string;
	name: string;
	surname: string;
	nickname?: string;
	position: PlayerPosition | null;
	email: string;
	phone: string | null;
	createdAt: Date;
	updatedAt: Date | null;
}

export interface AdminPlayerProfile extends PlayerProfile {
	isAdmin: boolean
	active: boolean
}

export interface AdminPlayerListOptions {
	name?: string;
	email?: string;
	phone?: string;
	active?: boolean;
	isAdmin?: boolean;
	sortBy?: "name" | "email" | "phone" | "active" | "isAdmin";
	sortOrder?: "asc" | "desc";
}

export interface Player extends Omit<AdminPlayerProfile, "nickname"> {
	nickname: string | null;
	passwordHash: string;
}

export interface PlayerUpdate {
	name?: string;
	surname?: string;
	nickname?: string;
	position?: PlayerPosition | null;
	email?: string;
	phone?: string;
	isAdmin?: boolean;
	active?: boolean;
}

export type PlayerUpdateResult =
	| { status: "updated"; player: Player }
	| { status: "not-found" }
	| { status: "conflict" };

export interface AdminPlayerCreate {
	name: string;
	surname: string;
	nickname: string | null;
	position: PlayerPosition | null;
	email: string;
	passwordHash: string;
	phone: string;
	isAdmin: boolean;
	active: boolean;
}