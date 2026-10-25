import { randomUUID } from "node:crypto";
import {
	Player,
	PlayerUpdateResult,
	AdminPlayerCreate,
	PlayerUpdate,
} from "../../../types/player";
import {
	AdminPlayerStatusUpdateResult,
	IPlayerRepository,
} from "./IPlayerRepository";
import { hashPasswordSync } from "../../../domain/Auth/Util/Password";

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

	async list(): Promise<Player[]> {
		return this.players.map((player) => ({ ...player }));
	}

	async findByEmail(email: string): Promise<Player | null> {
		return (
			this.players.find(
				(player) =>
					player.email.trim().toLowerCase() === email.trim().toLowerCase(),
			) || null
		);
	}

	async findById(id: string): Promise<Player | null> {
		for (const player of this.players.values()) {
			if (player.id === id) {
				return player;
			}
		}
		return null;
	}

	async create(input: AdminPlayerCreate): Promise<Player | null> {
		const email = input.email.trim().toLowerCase();
		if (
			this.players.some((player) => player.email.trim().toLowerCase() === email)
		) {
			return null;
		}

		const createdAt = new Date();
		const player: Player = {
			id: randomUUID(),
			name: input.name,
			email,
			phone: input.phone,
			passwordHash: input.passwordHash,
			isAdmin: input.isAdmin,
			active: input.active,
			createdAt,
			updatedAt: createdAt,
		};

		this.players.push(player);
		return { ...player };
	}

	async update(
		playerId: string,
		update: PlayerUpdate,
	): Promise<PlayerUpdateResult> {
		const player = this.players.find((candidate) => candidate.id === playerId);
		if (!player) {
			return { status: "not-found" };
		}

		const email = update.email?.trim().toLowerCase();
		if (
			email &&
			this.players.some(
				(candidate) =>
					candidate.id !== playerId &&
					candidate.email.trim().toLowerCase() === email,
			)
		) {
			return { status: "email-conflict" };
		}

		Object.assign(player, update, email ? { email } : {}, {
			updatedAt: new Date(),
		});
		return { status: "updated", player: { ...player } };
	}

	// update(
	// 	playerId: string,
	// 	playerUpdate: PlayerProfileUpdate,
	// ): Promise<PlayerProfileUpdateResult> {
	// 	const currentPlayer = this.players.find((player) => player.id === playerId);
	// 	if (!currentPlayer) {
	// 		return Promise.reject(new Error(`Player not found: ${playerId}`));
	// 	}

	// 	const updatedPlayer: Player = { ...currentPlayer, ...playerUpdate };
	// 	const playerIndex = this.players.findIndex(
	// 		(player) => player.id === playerId,
	// 	);
	// 	if (playerIndex !== -1) {
	// 		this.players[playerIndex] = updatedPlayer;
	// 	}

	// 	return Promise.resolve({
	// 		status: "updated",
	// 		player: updatedPlayer,
	// 	});
	// }

	async updatePlayerStatus(
		playerId: string,
		active: boolean,
	): Promise<AdminPlayerStatusUpdateResult> {
		const player = this.players.find((candidate) => candidate.id === playerId);
		if (!player) {
			return { status: "not-found" };
		}

		player.active = active;
		player.updatedAt = new Date();
		return { status: "updated", player: { ...player } };
	}

	async deletePlayer(playerId: string): Promise<"deleted" | "not-found"> {
		const index = this.players.findIndex((player) => player.id === playerId);
		if (index === -1) {
			return "not-found";
		}
		this.players.splice(index, 1);
		return "deleted";
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
