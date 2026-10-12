export interface Player {
	id: string;
	name: string;
	email: string;
	passwordHash: string;
	phone: string | null;
	isAdmin: boolean;
	active: boolean;
	createdAt: Date;
	updatedAt: Date | null;
}
