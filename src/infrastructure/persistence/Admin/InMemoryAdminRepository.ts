import { AdminRecord, IAdminRepository } from "./IAdminRepository";

export class InMemoryAdminRepository implements IAdminRepository {
	private readonly admins = new Map<string, AdminRecord>();

	async findByEmail(email: string): Promise<boolean> {
		return this.admins.has(email.trim().toLowerCase());
	}

	async createAdmin(admin: AdminRecord): Promise<boolean> {
		const email = admin.email.trim().toLowerCase();
		if (this.admins.has(email)) {
			return false;
		}

		this.admins.set(email, { ...admin, email });
		return true;
	}
}
