import { Prisma, PrismaClient } from "@prisma/client";
import { AdminRecord, IAdminRepository } from "./IAdminRepository";
import { Player } from "../../../types/player";

export class PrismaAdminRepository implements IAdminRepository {
	constructor(private readonly prisma: PrismaClient) {}

	async findByEmail(email: string): Promise<Player | null> {
		const user = await this.prisma.player.findUnique({
			where: { email },
			select: {
				id: true,
				name: true,
				email: true,
				phone: true,
				passwordHash: true,
				isAdmin: true,
				active: true,
				createdAt: true,
				updatedAt: true,
			},
		});
		return user || null;
	}

	async findById(id: string): Promise<Player | null> {
		const user = await this.prisma.player.findUnique({
			where: { id },
			select: {
				id: true,
				name: true,
				email: true,
				phone: true,
				passwordHash: true,
				isAdmin: true,
				active: true,
				createdAt: true,
				updatedAt: true,
			},
		});
		return user || null;
	}

	async createAdmin(admin: AdminRecord): Promise<boolean> {
		try {
			await this.prisma.player.create({ data: admin });
			return true;
		} catch (error) {
			if (
				error instanceof Prisma.PrismaClientKnownRequestError &&
				error.code === "P2002"
			) {
				return false;
			}
			throw error;
		}
	}
}
