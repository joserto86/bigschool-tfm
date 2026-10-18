import "dotenv/config";
import { input, password } from "@inquirer/prompts";
import { PrismaClient } from "@prisma/client";
import { pathToFileURL } from "node:url";
import { inspect } from "node:util";
import { CreateAdminUseCase } from "../src/domain/Admin/CreateAdminUseCase.js";
import { PrismaAdminRepository } from "../src/infrastructure/persistence/Admin/PrismaAdminRepository.js";
import { PrismaPlayerRepository } from "../src/infrastructure/persistence/Player/PrismaPlayerRepository.js";

async function main(): Promise<void> {
	if (!process.env.DATABASE_URL) {
		throw new Error("DATABASE_URL must be configured to create an administrator.");
	}

	const database = new PrismaClient();
	try {
		const createAdmin = new CreateAdminUseCase(
			new PrismaAdminRepository(database),
			new PrismaPlayerRepository(database)
		);
		const result = await createAdmin.execute({
			email: await input({ message: "Administrator email" }),
			name: await input({ message: "Administrator name" }),
			password: await password({
				message: "Administrator password",
				mask: "*",
			}),
		});
		console.log(`Administrator ${result.email} created successfully.`);
	} finally {
		await database.$disconnect();
	}
}

if (
	process.argv[1] &&
	import.meta.url === pathToFileURL(process.argv[1]).href
) {
	try {
		await main();
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : inspect(error);
		console.error(`Failed to create administrator: ${message}`);
		process.exitCode = 1;
	}
}
