import { z } from "zod";
import { hashPassword } from "../Auth/Util/Password";
import {
	Player,
	AdminPlayerCreate,
	PlayerUpdate,
	AdminPlayerProfile,
} from "../../types/player";
import { IPlayerRepository } from "../../infrastructure/persistence/Player/IPlayerRepository";
import {
	AdminPlayerEmailConflictError,
	AdminPlayerNotFoundError,
	InvalidAdminPlayerRequestError,
} from "./error/PlayerError";

const createPlayerSchema = z
	.object({
		name: z.string().trim().min(1),
		email: z.string().trim().toLowerCase().pipe(z.email()),
		password: z.string().min(8).max(128),
		phone: z.string().trim().min(1),
		isAdmin: z.boolean().optional(),
		active: z.boolean().optional(),
	})
	.strict();

const updatePlayerSchema = z
	.object({
		name: z.string().trim().min(1).optional(),
		email: z.string().trim().toLowerCase().pipe(z.email()).optional(),
		phone: z.string().trim().min(1).optional(),
		isAdmin: z.boolean().optional(),
		active: z.boolean().optional(),
	})
	.strict()
	.refine((update) => Object.keys(update).length > 0);

const updatePlayerStatusSchema = z.object({ active: z.boolean() }).strict();

function toAdminPlayerProfile(player: Player): AdminPlayerProfile {
	return {
		id: player.id,
		name: player.name,
		email: player.email,
		phone: player.phone,
		isAdmin: player.isAdmin,
		active: player.active,
		createdAt: player.createdAt,
		updatedAt: player.updatedAt ?? null,
	};
}

export class AdminPlayersUseCases {
	constructor(private readonly repository: IPlayerRepository) {}

	async listPlayers(): Promise<AdminPlayerProfile[]> {
		const players = await this.repository.list();
		return players.map(toAdminPlayerProfile);
	}

	async createPlayer(input: unknown): Promise<AdminPlayerProfile> {
		const parsed = createPlayerSchema.safeParse(input);
		if (!parsed.success) {
			throw new InvalidAdminPlayerRequestError();
		}

		const playerInput: AdminPlayerCreate = {
			name: parsed.data.name,
			email: parsed.data.email,
			passwordHash: await hashPassword(parsed.data.password),
			phone: parsed.data.phone,
			active: parsed.data.active ?? false,
			isAdmin: parsed.data.isAdmin ?? false,
		};

		const player = await this.repository.create(playerInput);

		if (!player) {
			console.log("Email conflict detected for email:", playerInput.email); // Log the email that caused the conflict
			throw new AdminPlayerEmailConflictError();
		}

		return toAdminPlayerProfile(player);
	}

	async getPlayer(playerId: string): Promise<AdminPlayerProfile> {
		const player = await this.repository.findById(playerId);
		if (!player) {
			throw new AdminPlayerNotFoundError();
		}
		return toAdminPlayerProfile(player);
	}

	async updatePlayer(
		playerId: string,
		input: unknown,
	): Promise<AdminPlayerProfile> {
		const parsed = updatePlayerSchema.safeParse(input);
		if (!parsed.success) {
			throw new InvalidAdminPlayerRequestError();
		}
		const update: PlayerUpdate = parsed.data;

		const result = await this.repository.update(playerId, update);
		if (result.status === "not-found") {
			throw new AdminPlayerNotFoundError();
		}
		if (result.status === "email-conflict") {
			throw new AdminPlayerEmailConflictError();
		}
		return toAdminPlayerProfile(result.player);
	}

	async updatePlayerStatus(
		playerId: string,
		input: unknown,
	): Promise<AdminPlayerProfile> {
		const parsed = updatePlayerStatusSchema.safeParse(input);
		if (!parsed.success) {
			throw new InvalidAdminPlayerRequestError();
		}
		const result = await this.repository.updatePlayerStatus(
			playerId,
			parsed.data.active,
		);
		if (result.status === "not-found") {
			throw new AdminPlayerNotFoundError();
		}
		return toAdminPlayerProfile(result.player);
	}

	async deletePlayer(playerId: string): Promise<void> {
		const result = await this.repository.deletePlayer(playerId);
		if (result === "not-found") {
			throw new AdminPlayerNotFoundError();
		}
	}
}
