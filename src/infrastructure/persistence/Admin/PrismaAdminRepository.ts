import { Prisma, PrismaClient } from "@prisma/client";
import { AdminRecord, IAdminRepository } from "./IAdminRepository";

export class PrismaAdminRepository implements IAdminRepository {
	constructor(private readonly prisma: PrismaClient) {}

	async findByEmail(email: string): Promise<boolean> {
		const user = await this.prisma.player.findUnique({
			where: { email },
			select: { id: true },
		});
		return user !== null;
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
