export interface AdminRecord {
	email: string;
	name: string;
	passwordHash: string;
	isAdmin: true;
	active: true;
}

export interface IAdminRepository {
	findByEmail(email: string): Promise<boolean>;
	createAdmin(admin: AdminRecord): Promise<boolean>;
}
