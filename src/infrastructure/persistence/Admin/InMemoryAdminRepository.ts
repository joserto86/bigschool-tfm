import { Player } from "../../../types/player";
import { AdminRecord, IAdminRepository } from "./IAdminRepository";

export class InMemoryAdminRepository implements IAdminRepository {
	private readonly players = new Map<string, Player>();

	private constructor() {
		this.createInitialPlayers()
	}

	async findByEmail(email: string): Promise<Player | null> {
		return this.players.get(email.trim().toLowerCase()) || null;
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
			id: this.generatePlayerId(this.players.size + 1),
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

	private createInitialPlayers() {
		for (let index = 1; index <= 3; index++) {
			const id = this.generatePlayerId(index);
			const email = `player-${index}@example.com`;

			const player: Player = {
				id,
				name: `Test Player ${index}`,
				email,
				phone: null,
				passwordHash: crypto.randomUUID(),
				isAdmin: false,
				active: true,
				createdAt: new Date(),
				updatedAt: null,
			};

			this.players.set(email, player);
		}
	}

	private generatePlayerId(index: number): string {
		return `player-${index}`;
	}
}
