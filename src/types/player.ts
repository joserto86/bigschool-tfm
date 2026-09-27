export interface Player {
	id: string;
	name: string;
	email: string;
	passwordHash: string;
	phone?: string;
	isAdmin: boolean;
}
