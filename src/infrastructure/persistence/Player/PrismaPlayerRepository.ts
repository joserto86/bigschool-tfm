import { PrismaClient } from "@prisma/client/extension";
import { Player, PlayerUpdate, PlayerUpdateResult, AdminPlayerCreate, } from "../../../types/player";
import {
	AdminPlayerStatusUpdateResult,
	IPlayerRepository,
} from "./IPlayerRepository";
import { Prisma } from "@prisma/client";

export class PrismaPlayerRepository implements IPlayerRepository {
	constructor(private readonly prisma: PrismaClient) { }
	
	async list(): Promise<Player[]> {
		const users = await this.prisma.player.findMany({
			orderBy: { createdAt: "asc" },
		});
		return users;
	}

	async findByEmail(email: string): Promise<Player | null> {
		const user = await this.prisma.player.findUnique({
			where: { email: email.trim().toLowerCase() },
		});

		if (!user) return null;
		return user;
	}

	async findById(playerId: string): Promise<Player | null> {
		const player = await this.prisma.player.findUnique({
			where: { id: playerId, active: true },
		});

		if (!player) return null;
		return player;
	}

	async create(input: AdminPlayerCreate): Promise<Player | null> {
		try {
			const user = await this.prisma.player.create({
				data: {
					name: input.name,
					email: input.email,
					passwordHash: input.passwordHash,
					phone: input.phone,
					active: input.active,
					isAdmin: false,
				},
			});
			return user;
		} catch (error) {
			if (
				error instanceof Prisma.PrismaClientKnownRequestError &&
				error.code === "P2002"
			) {
				return null;
			}
			throw error;
		}
	}

	async update(
		playerId: string,
		update: PlayerUpdate,
	): Promise<PlayerUpdateResult> {
		try {
			const player = await this.prisma.player.update({
				where: { id: playerId },
				data: {
					...(update.name !== undefined && { name: update.name }),
					...(update.email !== undefined && { email: update.email }),
					...(update.phone !== undefined && { phone: update.phone }),
					...(update.isAdmin !== undefined && {
						isAdmin: update.isAdmin,
					}),
					...(update.active !== undefined && {
						active: update.active,
					}),
				},
			});
			return { status: "updated", player };
		} catch (error) {
			if (
				error instanceof Prisma.PrismaClientKnownRequestError &&
				error.code === "P2002"
			) {
				return { status: "email-conflict" };
			}
			if (
				error instanceof Prisma.PrismaClientKnownRequestError &&
				error.code === "P2025"
			) {
				return { status: "not-found" };
			}
			throw error;
		}
	}

	async updatePlayerStatus(
		playerId: string,
		active: boolean,
	): Promise<AdminPlayerStatusUpdateResult> {
		try {
			const player = await this.prisma.player.update({
				where: { id: playerId },
				data: { active },
			});
			return { status: "updated", player };
		} catch (error) {
			if (
				error instanceof Prisma.PrismaClientKnownRequestError &&
				error.code === "P2025"
			) {
				return { status: "not-found" };
			}
			throw error;
		}
	}

	async deletePlayer(playerId: string): Promise<"deleted" | "not-found"> {
		try {
			await this.prisma.player.delete({ where: { id: playerId } });
			return "deleted";
		} catch (error) {
			if (
				error instanceof Prisma.PrismaClientKnownRequestError &&
				error.code === "P2025"
			) {
				return "not-found";
			}
			throw error;
		}
	}
}
