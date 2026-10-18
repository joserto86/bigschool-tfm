import { PrismaClient } from "@prisma/client/extension";
import { Player, PlayerProfileUpdate, PlayerProfileUpdateResult } from "../../../types/player";
import { IPlayerRepository } from "./IPlayerRepository";
import { Prisma } from "@prisma/client";

export class PrismaPlayerRepository implements IPlayerRepository {
	constructor(private readonly prisma: PrismaClient) {}

	async findByEmail(email: string): Promise<Player | null> {
		const user = await this.prisma.player.findUnique({
			where: { email: email.trim().toLowerCase() },
		});

		if (!user) return null;

		return {
			id: user.id,
			name: user.name,
			email: user.email,
			passwordHash: user.passwordHash,
			phone: user.phone,
			isAdmin: user.isAdmin,
			active: user.active,
			createdAt: user.createdAt,
			updatedAt: user.updatedAt ?? undefined,
		};
	}

	async findById(playerId: string): Promise<Player | null> {
		const user = await this.prisma.player.findUnique({
			where: { id: playerId, active: true },
		});

		if (!user) return null;

		return {
			id: user.id,
			name: user.name,
			email: user.email,
			passwordHash: user.passwordHash,
			phone: user.phone,
			isAdmin: user.isAdmin,
			active: user.active,
			createdAt: user.createdAt,
			updatedAt: user.updatedAt ?? undefined,
		};
	}

	async update(
		playerId: string,
		player: PlayerProfileUpdate,
	): Promise<PlayerProfileUpdateResult> {
		try {
			const user = await this.prisma.player.update({
				where: { id: playerId, active: true },
				data: {
					...(player.name !== undefined && { name: player.name.trim() }),
					...(player.email !== undefined && {
						email: player.email.trim().toLowerCase(),
					}),
					...(player.phone !== undefined && { phone: player.phone?.trim() }),
				},
			});

			return {
				status: "updated",
				player: {
					id: user.id,
					name: user.name,
					email: user.email,
          phone: user.phone,
          passwordHash: user.passwordHash,
					isAdmin: user.isAdmin,
					active: user.active,
					createdAt: user.createdAt,
					updatedAt: user.updatedAt,
				},
			};
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

}
