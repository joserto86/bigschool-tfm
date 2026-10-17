import { Player } from "@prisma/client";

export interface AdminRecord {
	email: string;
	name: string;
	passwordHash: string;
	isAdmin: true;
	active: true;
}

export interface IAdminRepository {
	findByEmail(email: string): Promise<Player | null>;
	createAdmin(admin: AdminRecord): Promise<boolean>;
	findById(id: string): Promise<Player| null>;
}
