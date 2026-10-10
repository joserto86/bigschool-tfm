import { Prisma, PrismaClient } from "@prisma/client";
import { IAuthRepository, IRefreshTokenRecord } from "./IAuthRepository";
import { Player } from "../../../types/player";

export class PrismaAuthRepository implements IAuthRepository {
	constructor(private readonly prisma: PrismaClient) {}

	async findUserByEmail(email: string): Promise<Player | undefined> {
		const user = await this.prisma.player.findUnique({
			where: { email: email.trim().toLowerCase() },
		});

		if (!user) return undefined;

		return {
			id: user.id,
			name: user.name,
			email: user.email,
			passwordHash: user.passwordHash,
			phone: user.phone ?? undefined,
			isAdmin: user.isAdmin,
		};
	}

	async findUserById(playerId: string): Promise<Player | undefined> {
		const user = await this.prisma.player.findUnique({
			where: { id: playerId },
		});

		if (!user) return undefined;

		return {
			id: user.id,
			name: user.name,
			email: user.email,
			passwordHash: user.passwordHash,
			phone: user.phone ?? undefined,
			isAdmin: user.isAdmin,
		};
	}

	async updatePasswordHash(
		playerId: string,
		passwordHash: string,
	): Promise<void> {
		await this.prisma.player.update({
			where: { id: playerId },
			data: { passwordHash },
		});
	}

	async saveRefreshToken(record: IRefreshTokenRecord): Promise<void> {
		await this.prisma.refreshToken.create({
			data: {
				tokenHash: record.tokenHash,
				playerId: record.playerId,
				familyId: record.familyId,
				expiresAt: record.expiresAt,
				revoked: record.revoked,
			},
		});
	}

	async findRefreshTokenByHash(
		tokenHash: string,
	): Promise<IRefreshTokenRecord | undefined> {
		const record = await this.prisma.refreshToken.findUnique({
			where: { tokenHash },
		});

		if (!record) return undefined;

		return {
			tokenHash: record.tokenHash,
			playerId: record.playerId,
			familyId: record.familyId,
			expiresAt: record.expiresAt,
			revoked: record.revoked,
		};
	}

	async rotateRefreshToken(
		presentedTokenHash: string,
		replacement: IRefreshTokenRecord,
		now: Date,
	): Promise<boolean> {
		return this.prisma.$transaction(async (tx) => {
			const presented = await tx.refreshToken.findUnique({
				where: { tokenHash: presentedTokenHash },
			});

			if (!presented) return false;
			if (presented.revoked) {
				await tx.refreshToken.updateMany({
					where: { familyId: presented.familyId },
					data: { revoked: true },
				});
				return false;
			}
			if (presented.expiresAt <= now) {
				await tx.refreshToken.update({
					where: { tokenHash: presentedTokenHash },
					data: { revoked: true },
				});
				return false;
			}

			await tx.refreshToken.update({
				where: { tokenHash: presentedTokenHash },
				data: { revoked: true },
			});

			await tx.refreshToken.create({
				data: {
					tokenHash: replacement.tokenHash,
					playerId: replacement.playerId,
					familyId: replacement.familyId,
					expiresAt: replacement.expiresAt,
					revoked: replacement.revoked,
				},
			});

			return true;
		});
	}

	async revokeActiveRefreshTokens(playerId: string): Promise<void> {
		await this.prisma.refreshToken.updateMany({
			where: { playerId, revoked: false },
			data: { revoked: true },
		});
	}
}
