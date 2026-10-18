import { randomUUID } from "crypto";
import { Player } from "../../../types/player";
import { AdminRecord, IAdminRepository } from "./IAdminRepository";

export class InMemoryAdminRepository implements IAdminRepository {
	private readonly players = new Map<string, Player>();

	async createAdmin(player: AdminRecord): Promise<boolean> {
		const email = player.email.trim().toLowerCase();
		if (this.players.has(email)) {
			return false;
		}

		const newPlayer: Player = {
			id: randomUUID(),
			name: player.name,
			email: email,
			phone: null,
			passwordHash: player.passwordHash,
			isAdmin: true,
			active: true,
			createdAt: new Date(),
			updatedAt: null,
		}

		this.players.set(email, newPlayer);
		return true;
	}
}
