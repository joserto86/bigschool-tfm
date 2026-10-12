import { Player } from "../../../types/player";
import { AdminRecord, IAdminRepository } from "./IAdminRepository";

export class InMemoryAdminRepository implements IAdminRepository {
	private readonly players = new Map<string, Player>();

	async findByEmail(email: string): Promise<boolean> {
		return this.players.has(email.trim().toLowerCase());
	}

	async findById(id: string): Promise<Player | null> {
		for (const player of this.players.values()) {
			if (player.id === id) {
				return player;
			}
		}
		return null;
	}

	async createAdmin(player: AdminRecord): Promise<boolean> {
		const email = player.email.trim().toLowerCase();
		if (this.players.has(email)) {
			return false;
		}

		const newPlayer: Player = {
			id: crypto.randomUUID(),
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
