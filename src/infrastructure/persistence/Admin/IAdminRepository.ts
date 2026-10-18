import { Player } from "@prisma/client";

export interface AdminRecord {
	email: string;
	name: string;
	passwordHash: string;
	isAdmin: true;
	active: true;
}

export interface IAdminRepository {
	createAdmin(admin: AdminRecord): Promise<boolean>;
}
