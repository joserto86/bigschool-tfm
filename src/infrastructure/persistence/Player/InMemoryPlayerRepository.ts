// import { Player } from "@prisma/client";
import {
	Player,
	PlayerProfileUpdate,
	PlayerProfileUpdateResult,
} from "../../../types/player";
import { IPlayerRepository } from "./IPlayerRepository";
import { IAdminRepository } from "../Admin/IAdminRepository";

export class InMemoryPlayerRepository implements IPlayerRepository {
	private constructor(private readonly adminRepository: IAdminRepository) {}
	
  async findUserByEmail(email: string): Promise<Player | null> {
		return await this.adminRepository.findByEmail(email);
	}
	
  async findUserById(playerId: string): Promise<Player | null> {
		return await this.adminRepository.findById(playerId);
	}

	private readonly players = new Map<string, Player>();

	// constructor(players: Player[] = []) {
	// 	for (const player of players) {
	// 		this.players.set(this.getPlayerId(player), player);
	// 	}
	// }

	// async findUserByEmail(email: string): Promise<Player | undefined> {
	// 	return [...this.players.values()].find((player) => player.email === email);
	// }

	// async findUserById(playerId: string): Promise<Player | undefined> {
	// 	return this.players.get(playerId);
	// }

	updatePlayerProfile(
		playerId: string,
		playerUpdate: PlayerProfileUpdate,
	): Promise<PlayerProfileUpdateResult> {
		const currentPlayer = this.players.get(playerId);
		if (!currentPlayer) {
			return Promise.reject(new Error(`Player not found: ${playerId}`));
		}

		console.log(
			"InMemoryPlayerRepository.updatePlayerProfile currentPlayer:",
			currentPlayer,
		);

		const updatedPlayer: Player = { ...currentPlayer, ...playerUpdate };
		this.players.set(playerId, updatedPlayer);

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
}
