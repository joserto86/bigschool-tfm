import { PlayerPosition } from "../../../types/player";

export interface AdminRecord {
	email: string;
	name: string;
	surname: string;
	nickname: string | null;
	position: PlayerPosition | null;
	passwordHash: string;
	isAdmin: true;
	active: true;
}

export interface IAdminRepository {
	createAdmin(admin: AdminRecord): Promise<boolean>;
}
