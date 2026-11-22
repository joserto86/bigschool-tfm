import { z } from "zod";
import { Player, PlayerProfile, PlayerUpdate } from "../../types/player";
import { IPlayerRepository } from "../../infrastructure/persistence/Player/IPlayerRepository";
import { AuthenticationFailedError } from "../Auth/Error";

const updateOwnPlayerSchema = z
	.object({
		name: z.string().trim().min(1).optional(),
		surname: z.string().min(1).optional(),
		nickname: z.string().min(1).optional(),
		position: z.enum(["left", "right"]).nullable().optional(),
		email: z.string().trim().toLowerCase().pipe(z.email()).optional(),
		phone: z.string().trim().min(1).optional(),
	})
	.strict()
	.refine((update) => Object.keys(update).length > 0);

function toPlayerProfile(player: Player): PlayerProfile {
	return {
		id: player.id,
		name: player.name,
		surname: player.surname,
		...(player.nickname === null ? {} : { nickname: player.nickname }),
		position: player.position,
		email: player.email,
		phone: player.phone,
		createdAt: player.createdAt,
		updatedAt: player.updatedAt ?? null,
	};
}

export class InvalidOwnPlayerUpdateError extends Error {
	constructor() {
		super("Provide at least one valid field: name, surname, nickname, position, email, or phone.");
		this.name = "InvalidOwnPlayerUpdateError";
	}
}

export class OwnPlayerConflictError extends Error {
	constructor() {
		super("A player with this email or nickname already exists.");
		this.name = "OwnPlayerConflictError";
	}
}

export class GetOwnPlayerUseCase {
	constructor(private readonly playerRepository: IPlayerRepository) {}

	async execute(playerId: string): Promise<PlayerProfile> {
		const player = await this.playerRepository.findById(playerId);
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
		input: PlayerUpdate,
	): Promise<PlayerProfile> {

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
		if (result.status === "conflict") {
			throw new OwnPlayerConflictError();
		}

		return toPlayerProfile(result.player);
	}
}
