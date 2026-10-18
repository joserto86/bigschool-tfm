export interface PlayerProfile {
	id: string;
	name: string;
	email: string;
	phone: string | null;
	createdAt: Date;
	updatedAt: Date | null;
}

export interface AdminPlayerProfile extends PlayerProfile {
	isAdmin: boolean
	active: boolean
}

export interface Player extends AdminPlayerProfile {
	passwordHash: string;
}

export interface PlayerUpdate {
	name?: string;
	email?: string;
	phone?: string;
	isAdmin?: boolean;
	active?: boolean;
}

export type PlayerUpdateResult =
	| { status: "updated"; player: Player }
	| { status: "not-found" }
	| { status: "email-conflict" };

export interface AdminPlayerCreate {
	name: string;
	email: string;
	passwordHash: string;
	phone: string;
	isAdmin: boolean;
	active: boolean;
}

// export interface AdminPlayerUpdate {
// 	name?: string;
// 	email?: string;
// 	phone?: string;
// 	isAdmin?: boolean;
// 	active?: boolean;
// }