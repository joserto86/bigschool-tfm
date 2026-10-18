import { z } from "zod";
import { Player, PlayerProfile, PlayerProfileUpdate } from "../../types/player";
import { AuthenticationFailedError } from "../Auth/LoginUseCase";
import { IPlayerRepository } from "../../infrastructure/persistence/Player/IPlayerRepository";

const updateOwnPlayerSchema = z
	.object({
		name: z.string().trim().min(1).optional(),
		email: z.string().trim().toLowerCase().pipe(z.email()).optional(),
		phone: z.string().trim().min(1).optional(),
	})
	.strict()
	.refine((update) => Object.keys(update).length > 0);

function toPlayerProfile(player: Player): PlayerProfile {
	return {
		id: player.id,
		name: player.name,
		email: player.email,
		phone: player.phone,
		createdAt: player.createdAt,
		updatedAt: player.updatedAt ?? null,
	};
}

export class InvalidOwnPlayerUpdateError extends Error {
	constructor() {
		super("Provide at least one valid field: name, email, or phone.");
		this.name = "InvalidOwnPlayerUpdateError";
	}
}

export class OwnPlayerEmailConflictError extends Error {
	constructor() {
		super("A player with this email already exists.");
		this.name = "OwnPlayerEmailConflictError";
	}
}

export class GetOwnPlayerUseCase {
	constructor(private readonly playerRepository: IPlayerRepository) {}

	async execute(playerId: string): Promise<PlayerProfile> {
		const player = await this.playerRepository.findById(playerId);

		console.log('playerId: ' + playerId);

		if (!player?.active) {
			throw new AuthenticationFailedError();
		}

		return toPlayerProfile(player);
	}
}

export class UpdateOwnPlayerUseCase {
	constructor(private readonly playerRepository: IPlayerRepository) {}

	async execute(
		playerId: string,
		input: PlayerProfileUpdate,
	): Promise<PlayerProfile> {

		console.log('playerId' + playerId);

		const parsed = updateOwnPlayerSchema.safeParse(input);
		if (!parsed.success) {
			throw new InvalidOwnPlayerUpdateError();
		}
		
		const result = await this.playerRepository.update(
			playerId,
			parsed.data,
		);
		if (result.status === "not-found") {
			throw new AuthenticationFailedError();
		}
		if (result.status === "email-conflict") {
			throw new OwnPlayerEmailConflictError();
		}

		return toPlayerProfile(result.player);
	}
}
