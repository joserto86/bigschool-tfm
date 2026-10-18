import {
	Player,
	PlayerProfileUpdate,
	PlayerProfileUpdateResult,
} from "../../../types/player";
import { IPlayerRepository } from "./IPlayerRepository";
import { hashPasswordSync } from "../../../domain/Auth/Password";


const DEVELOPMENT_TEST_USER: Player | undefined =
	process.env.NODE_ENV === "production"
		? undefined
		: {
				id: "test-player",
				name: "Test Player",
				email: "player@example.com",
				phone: "+34600111222",
				passwordHash: hashPasswordSync("correct-password"),
				isAdmin: false,
				active: true,
				createdAt: new Date(),
				updatedAt: null,
			};


export class InMemoryPlayerRepository implements IPlayerRepository {
	private readonly players: Player[];

	constructor(initialUsers: readonly Player[] = []) {
		this.players = [...initialUsers];

		if (
			DEVELOPMENT_TEST_USER &&
			!this.players.some(
				(user) => user.email.trim().toLowerCase() === "player@example.com",
			)
		) {
			this.players.push({ ...DEVELOPMENT_TEST_USER });
			this.createInitialPlayers;
		}
	}

	async findByEmail(email: string): Promise<Player | null> {
		return this.players.find((player) => player.email.trim().toLowerCase() === email.trim().toLowerCase()) || null;
	}

	async findById(id: string): Promise<Player | null> {
		for (const player of this.players.values()) {
			if (player.id === id) {
				return player;
			}
		}
		return null;
	}

	update(
		playerId: string,
		playerUpdate: PlayerProfileUpdate,
	): Promise<PlayerProfileUpdateResult> {
		const currentPlayer = this.players.find((player) => player.id === playerId);
		if (!currentPlayer) {
			return Promise.reject(new Error(`Player not found: ${playerId}`));
		}

		console.log(
			"InMemoryPlayerRepository.updatePlayerProfile currentPlayer:",
			currentPlayer,
		);

		const updatedPlayer: Player = { ...currentPlayer, ...playerUpdate };
		const playerIndex = this.players.findIndex((player) => player.id === playerId);
		if (playerIndex !== -1) {
			this.players[playerIndex] = updatedPlayer;
		}

		return Promise.resolve({
			status: "updated",
			player: updatedPlayer,
		});
	}

	private getPlayerId(player: Player): string {
		const candidate = player as Player & { id?: string; playerId?: string };
		const playerId = candidate.playerId ?? candidate.id;
		if (!playerId) {
			throw new Error("Player must have an id or playerId");
		}
		return playerId;
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

			this.players.push(player);
		}
	}

	private generatePlayerId(index: number): string {
		return `player-${index}`;
	}
}
