import { PrismaClient } from "@prisma/client";
import { Match, MatchPlayer } from "../../../types/match";
import { IMatchRepository } from "./IMatchRepository";

export class PrismaMatchRepository implements IMatchRepository {
	constructor(private readonly prisma: PrismaClient) {}

	async create(match: Match): Promise<Match> {
		const created = await this.prisma.match.create({
			data: {
				id: match.id,
				dateTime: this.parseDateTime(match.dateTime),
				status: match.status,
				players: {
					create: match.players.map((player: MatchPlayer) => ({
						playerId: player.playerId,
						slot: player.slot,
						confirmation: player.confirmation ?? "PENDING",
					})),
				},
				createdAt: match.createdAt,
				updatedAt: match.updatedAt ?? new Date(),
			},
			include: { players: true },
		});

		return {
			id: created.id,
			dateTime: created.dateTime.toISOString(),
			status: created.status as Match["status"],
			players: created.players.map((player: MatchPlayer) => ({
				playerId: player.playerId,
				slot: player.slot,
				confirmation: (player.confirmation ??
					"PENDING") as Match["players"][number]["confirmation"],
			})),
			createdAt: created.createdAt,
			updatedAt: created.updatedAt ?? undefined,
		};
	}

	async update(match: Match): Promise<Match> {
		const updated = await this.prisma.match.update({
			where: { id: match.id },
			data: {
				dateTime: this.parseDateTime(match.dateTime),
				status: match.status,
				players: {
					deleteMany: {},
					create: match.players.map((player: MatchPlayer) => ({
						playerId: player.playerId,
						slot: player.slot,
						confirmation: player.confirmation ?? "PENDING",
					})),
				},
				updatedAt: match.updatedAt ?? new Date(),
			},
			include: { players: true },
		});

		return {
			id: updated.id,
			dateTime: updated.dateTime.toISOString(),
			status: updated.status as Match["status"],
			players: updated.players.map((player: MatchPlayer) => ({
				playerId: player.playerId,
				slot: player.slot,
				confirmation: (player.confirmation ??
					"PENDING") as Match["players"][number]["confirmation"],
			})),
			createdAt: updated.createdAt,
			updatedAt: updated.updatedAt ?? undefined,
		};
	}

	async findByDateTime(dateTime: string): Promise<Match[]> {
		const matches = await this.prisma.match.findMany({
			where: { dateTime: this.parseDateTime(dateTime) },
			include: { players: true },
		});

		return matches.map((match: Match) => this.toDomain(match));
	}

	async findById(matchId: string): Promise<Match | undefined> {
		const match = await this.prisma.match.findUnique({
			where: { id: matchId },
			include: { players: true },
		});

		if (!match) return undefined;
		return this.toDomain(match);
	}

	async deleteById(matchId: string): Promise<void> {
		await this.prisma.match.delete({
			where: { id: matchId },
		});
	}

	private toDomain(match: {
		id: string;
		dateTime: Date;
		status: string;
		createdAt: Date;
		updatedAt?: Date | null;
		players: Array<{
			playerId: string;
			slot: number;
			confirmation: string | null;
		}>;
	}): Match {
		return {
			id: match.id,
			dateTime: match.dateTime.toISOString(),
			status: match.status as Match["status"],
			players: match.players.map((player) => ({
				playerId: player.playerId,
				slot: player.slot,
				confirmation: (player.confirmation ??
					"PENDING") as Match["players"][number]["confirmation"],
			})),
			createdAt: match.createdAt,
			updatedAt: match.updatedAt ?? null,
		};
	}

	private parseDateTime(value: string): Date {
		// Fix an extra zero after the day, e.g. 2026-10-190T18:30:00+02:00.
		const normalized = value.replace(
			/^(\d{4}-\d{2}-(?:0[1-9]|[12]\d|3[01]))0(T.*)$/,
			"$1$2",
		);
		const date = new Date(normalized);

		if (Number.isNaN(date.getTime())) {
			throw new Error(`Invalid match dateTime: ${value}`);
		}

		return date;
	}
}
