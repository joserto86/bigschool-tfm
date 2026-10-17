import { PrismaClient } from "@prisma/client/extension";
import { Player, PlayerProfileUpdate, PlayerProfileUpdateResult } from "../../../types/player";
import { IPlayerRepository } from "./IPlayerRepository";
import { IAdminRepository } from "../Admin/IAdminRepository";
import { Prisma } from "@prisma/client";

export class PrismaPlayerRepository implements IPlayerRepository {
  constructor(private readonly prisma: PrismaClient,
              private readonly adminRepository: IAdminRepository) {}
  
  async findUserByEmail(email: string): Promise<Player | null> {
    return await this.adminRepository.findByEmail(email);
	}
	
  async findUserById(playerId: string): Promise<Player | null> {
    return await this.adminRepository.findById(playerId);
  }
  
	async updatePlayerProfile(playerId: string, player: PlayerProfileUpdate): Promise<PlayerProfileUpdateResult> {
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
            isAdmin: user.isAdmin,
            active: user.active,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          }
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
