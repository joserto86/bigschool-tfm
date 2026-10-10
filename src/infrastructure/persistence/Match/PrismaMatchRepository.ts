import { PrismaClient } from "@prisma/client";
import { Match, MatchPlayer } from "../../../types/match";
import { IMatchRepository } from "./IMatchRepository";

export class PrismaMatchRepository implements IMatchRepository {
	constructor(private readonly prisma: PrismaClient) {}

	async create(match: Match): Promise<Match> {
		const created = await this.prisma.match.create({
			data: {
				id: match.id,
				dateTime: new Date(match.dateTime),
				status: match.status,
				players: {
					create: match.players.map((player: MatchPlayer) => ({
						playerId: player.playerId,
						slot: player.slot,
						confirmation: player.confirmation ?? "PENDING",
					})),
				},
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
		};
	}

	async findByDateTime(dateTime: string): Promise<Match[]> {
		const matches = await this.prisma.match.findMany({
			where: { dateTime: new Date(dateTime) },
			include: { players: true },
		});

		return matches.map((match:Match) => this.toDomain(match));
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
		};
	}
}
