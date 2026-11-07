import { z } from "zod";
import { CreateMatchUseCase } from "../Match/CreateMatchUseCase";
import { GetMatchesUseCase } from "../Match/GetMatchesUseCase";
import { IMatchRepository } from "../../infrastructure/persistence/Match/IMatchRepository";
import { IPlayerRepository } from "../../infrastructure/persistence/Player/IPlayerRepository";
import { Match, MatchPlayer, MatchStatus } from "../../types/match";
import {
	AdminMatchDuplicatePlayerError,
	AdminMatchPlayerAlreadyRegisteredError,
	AdminMatchPlayerNotFoundError,
	AdminMatchPlayerRemovalNotAllowedError,
	AdminMatchRequiresFourPlayersError,
	AdminMatchSlotAlreadyUsedError,
	InvalidAdminMatchRequestError,
	InvalidAdminMatchTransitionError,
} from "./error/MatchError";
import { FULL_MATCH_PLAYER_COUNT } from "../Match/Constants";

const adminMatchPlayerInputSchema = z
	.object({
		id: z.string().min(1),
		slot: z.number().int().min(1).max(FULL_MATCH_PLAYER_COUNT),
		confirmation: z
			.enum(["PENDING", "CONFIRMED", "DECLINED"])
			.default("PENDING"),
	})
	.strict();

const createMatchSchema = z
	.object({
		dateTime: z.iso.datetime({ offset: true }),
		place: z.string().nullable().optional(),
		players: z
			.array(adminMatchPlayerInputSchema)
			.max(FULL_MATCH_PLAYER_COUNT)
			.optional(),
	})
	.strict();

const replaceMatchSchema = z
	.object({
		dateTime: z.iso.datetime({ offset: true }),
		place: z.string().nullable(),
		status: z.enum(["OPEN", "COMPLETED", "CONFIRMED", "CANCELLED"]),
		players: z.array(adminMatchPlayerInputSchema).max(FULL_MATCH_PLAYER_COUNT),
	})
	.strict();

const patchMatchSchema = z
	.object({
		dateTime: z.iso.datetime({ offset: true }).optional(),
		place: z.string().nullable().optional(),
		status: z.enum(["OPEN", "COMPLETED", "CONFIRMED", "CANCELLED"]).optional(),
	})
	.strict()
	.refine((update) => Object.keys(update).length > 0);

type AdminMatchPlayerInput = z.infer<typeof adminMatchPlayerInputSchema>;

const allowedTransitions: Record<MatchStatus, MatchStatus[]> = {
	OPEN: ["COMPLETED", "CANCELLED"],
	COMPLETED: ["CONFIRMED", "CANCELLED"],
	CONFIRMED: ["CANCELLED", "COMPLETED"],
	CANCELLED: ["COMPLETED"],
};

function isDateTimeInFuture(dateTime: string): boolean {
	return new Date(dateTime).getTime() > Date.now();
}

export class AdminMatchesUseCases {
	private readonly createMatchUseCase: CreateMatchUseCase;
	private readonly getMatchUseCase: GetMatchesUseCase;

	constructor(
		private readonly matchRepository: IMatchRepository,
		private readonly playerRepository: IPlayerRepository,
	) {
		this.createMatchUseCase = new CreateMatchUseCase(matchRepository);
		this.getMatchUseCase = new GetMatchesUseCase(matchRepository);
	}

	async listMatches(input: unknown): Promise<Match[]> {
		return this.getMatchUseCase.listMatches(input, true);
	}

	async createMatch(input: unknown): Promise<Match> {
		const parsed = createMatchSchema.safeParse(input);
		if (!parsed.success) {
			throw new InvalidAdminMatchRequestError();
		}
		const players = await this.validatePlayers(parsed.data.players ?? []);
		return this.createMatchUseCase.execute({
			dateTime: parsed.data.dateTime,
			place: parsed.data.place ?? null,
			players,
		});
	}

	async getMatch(matchId: string): Promise<Match> {
		return this.getMatchUseCase.getMatch(matchId);
	}

	async deleteMatch(matchId: string): Promise<void> {
		await this.getMatch(matchId);
		await this.matchRepository.deleteById(matchId);
	}

	async replaceMatch(matchId: string, input: unknown): Promise<Match> {
		const parsed = replaceMatchSchema.safeParse(input);

		if (!parsed.success) {
			console.log("not parsed");
			throw new InvalidAdminMatchRequestError();
		}
		if (!isDateTimeInFuture(parsed.data.dateTime)) {
			throw new InvalidAdminMatchRequestError();
		}

		const match = await this.getMatch(matchId);
		const players = await this.validatePlayers(parsed.data.players, matchId);
		const playerIds = new Set(players.map(({ playerId }) => playerId));
		const removedPlayer = match.players.some(
			({ playerId }) => !playerIds.has(playerId),
		);

		if (removedPlayer) {
			if (match.status === "CONFIRMED" || match.status === "CANCELLED") {
				throw new AdminMatchPlayerRemovalNotAllowedError();
			}
			players.forEach((player) => {
				player.confirmation = "PENDING";
			});
			match.status = "OPEN";
		} else {
			this.validateStatusTransition(
				match.status,
				parsed.data.status,
				players.length,
			);
			match.status = parsed.data.status;
		}

		match.dateTime = parsed.data.dateTime;
		match.place = parsed.data.place;
		match.players = players;
		match.updatedAt = new Date();
		return this.matchRepository.update(match);
	}

	async patchMatch(matchId: string, input: unknown): Promise<Match> {
		const parsed = patchMatchSchema.safeParse(input);
		if (!parsed.success) {
			throw new InvalidAdminMatchRequestError();
		}
		if (
			parsed.data.dateTime !== undefined &&
			!isDateTimeInFuture(parsed.data.dateTime)
		) {
			throw new InvalidAdminMatchRequestError();
		}

		const match = await this.getMatch(matchId);
		if (parsed.data.status !== undefined) {
			this.validateStatusTransition(
				match.status,
				parsed.data.status,
				match.players.length,
			);
			match.status = parsed.data.status;
		}
		if (parsed.data.dateTime !== undefined) {
			match.dateTime = parsed.data.dateTime;
		}
		if (parsed.data.place !== undefined) {
			match.place = parsed.data.place;
		}
		match.updatedAt = new Date();
		return this.matchRepository.update(match);
	}

	private async validatePlayers(
		inputs: AdminMatchPlayerInput[],
		matchId?: string,
	): Promise<MatchPlayer[]> {
		const playerIds = new Set<string>();
		const slots = new Set<number>();
		const players: MatchPlayer[] = [];

		for (const input of inputs) {
			if (playerIds.has(input.id)) {
				if (matchId) {
					throw new AdminMatchPlayerAlreadyRegisteredError(input.id, matchId);
				}
				throw new AdminMatchDuplicatePlayerError(input.id);
			}
			if (slots.has(input.slot)) {
				throw new AdminMatchSlotAlreadyUsedError(input.slot);
			}
			playerIds.add(input.id);
			slots.add(input.slot);

			const registeredPlayer = await this.playerRepository.findById(input.id);
			if (!registeredPlayer) {
				throw new AdminMatchPlayerNotFoundError(input.id);
			}

			players.push({
				playerId: input.id,
				slot: input.slot,
				confirmation: input.confirmation,
			});
		}

		return players;
	}

	private validateStatusTransition(
		currentStatus: MatchStatus,
		nextStatus: MatchStatus,
		playerCount: number,
	): void {
		if (
			currentStatus !== nextStatus &&
			!allowedTransitions[currentStatus].includes(nextStatus)
		) {
			throw new InvalidAdminMatchTransitionError(currentStatus, nextStatus);
		}
		if (nextStatus === "COMPLETED" && playerCount !== FULL_MATCH_PLAYER_COUNT) {
			throw new AdminMatchRequiresFourPlayersError();
		}
	}
}
