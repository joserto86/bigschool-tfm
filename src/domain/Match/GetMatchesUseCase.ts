import { z } from "zod";
import { Match } from "../../types/match";
import { MatchListOptions } from "../../types/match";
import { IMatchRepository } from "../../infrastructure/persistence/Match/IMatchRepository";
import {
	InvalidMatchListQueryError,
	MatchNotFoundError,
} from "./error";

const matchListFields = {
	from: z.iso.datetime({ offset: true }).optional(),
	to: z.iso.datetime({ offset: true }).optional(),
	sortBy: z.enum(["createdAt", "updatedAt"]).default("createdAt"),
	sortOrder: z.enum(["asc", "desc"]).default("asc"),
};

const publicMatchListQuerySchema = z
	.object(matchListFields)
	.strict()
	.refine(
		(query) =>
			query.from === undefined ||
			query.to === undefined ||
			new Date(query.to).getTime() > new Date(query.from).getTime(),
	);

const adminMatchListQuerySchema = z
	.object({
		...matchListFields,
		playerId: z.string().trim().min(1).optional(),
		status: z.enum(["OPEN", "COMPLETED", "CONFIRMED", "CANCELLED"]).optional(),
	})
	.strict()
	.refine(
		(query) =>
			query.from === undefined ||
			query.to === undefined ||
			new Date(query.to).getTime() > new Date(query.from).getTime(),
	);

export class GetMatchesUseCase {
	constructor(private readonly matchRepository: IMatchRepository) {}

	async getMatch(matchId: string): Promise<Match> {
		const match = await this.matchRepository.findById(matchId);
		if (!match) {
			throw new MatchNotFoundError(matchId);
		}
		return match;
	}

	async listMatches(input: unknown, includeAdminFilters = false): Promise<Match[]> {
		let options: MatchListOptions;
		if (includeAdminFilters) {
			const parsed = adminMatchListQuerySchema.safeParse(input);
			if (!parsed.success) {
				throw new InvalidMatchListQueryError();
			}
			options = {
				...(parsed.data.from !== undefined
					? { from: new Date(parsed.data.from) }
					: {}),
				...(parsed.data.to !== undefined
					? { to: new Date(parsed.data.to) }
					: {}),
				sortBy: parsed.data.sortBy,
				sortOrder: parsed.data.sortOrder,
				...(parsed.data.playerId !== undefined
					? { playerId: parsed.data.playerId }
					: {}),
				...(parsed.data.status !== undefined
					? { status: parsed.data.status }
					: {}),
			};
		} else {
			const parsed = publicMatchListQuerySchema.safeParse(input);
			if (!parsed.success) {
				throw new InvalidMatchListQueryError();
			}
			options = {
				...(parsed.data.from !== undefined
					? { from: new Date(parsed.data.from) }
					: {}),
				...(parsed.data.to !== undefined
					? { to: new Date(parsed.data.to) }
					: {}),
				sortBy: parsed.data.sortBy,
				sortOrder: parsed.data.sortOrder,
			};
		}

		return this.matchRepository.list(options);
	}

	async getMatchesForPlayerAfter(
		playerId: string,
		dateTime: Date,
	): Promise<Match[]> {
		return this.matchRepository.findByPlayerIdAfterDateTime(playerId, dateTime);
	}
}
