import { beforeEach, describe, expect, it, vi } from "vitest";
import { CreateAdminUseCase } from "../domain/Admin/CreateAdminUseCase.js";
import { verifyPassword } from "../domain/Auth/Util/Password.js";
import { InMemoryAdminRepository } from "../infrastructure/persistence/Admin/InMemoryAdminRepository.js";
import { InMemoryPlayerRepository } from "../infrastructure/persistence/Player/InMemoryPlayerRepository.js";
import { IPlayerRepository } from "../infrastructure/persistence/Player/IPlayerRepository.js";
import { IAdminRepository } from "../infrastructure/persistence/Admin/IAdminRepository.js";
import {
	AdminEmailAlreadyExistsError,
	InvalidAdminRequestError,
} from "../domain/Admin/error/AdminError.js";

describe("CreateAdminUseCase", () => {
	let adminRepository: IAdminRepository;
	let playerRepository: IPlayerRepository;
	let useCase: CreateAdminUseCase;

	beforeEach(() => {
		adminRepository = new InMemoryAdminRepository();
		playerRepository = new InMemoryPlayerRepository();
		useCase = new CreateAdminUseCase(adminRepository, playerRepository);
	});

	function executeAdmin(input: {
		email: string;
		name: string;
		surname: string;
		password: string;
	}) {
		return useCase.execute(input);
	}

	it("creates an active administrator with a normalized email and a password hash", async () => {
		const createAdminSpy = vi.spyOn(adminRepository, "createAdmin");
		const result = await executeAdmin({
			email: " ADMIN@EXAMPLE.COM ",
			name: " Ada Admin ",
			surname: "Admin Surname",
			password: "secure-password",
		});

		const createCall = createAdminSpy.mock.calls[0]?.[0];
		expect(createCall).toMatchObject({
			email: "admin@example.com",
			name: "Ada Admin",
			surname: "Admin Surname",
			position: null,
			isAdmin: true,
			active: true,
		});
		expect(createCall.passwordHash).not.toBe("secure-password");
		await expect(
			verifyPassword("secure-password", createCall.passwordHash),
		).resolves.toBe(true);
		expect(result).toEqual({ email: "admin@example.com" });
	});

	it("does not create or elevate an account when the email already exists", async () => {
		await executeAdmin({
			email: "admin@example.com",
			name: "Admin",
			surname: "Admin Surname",
			password: "secure-password",
		});

		await expect(
			executeAdmin({
				email: "admin@example.com",
				name: "Admin",
				surname: "Admin Surname",
				password: "secure-password",
			}),
		).rejects.toBeInstanceOf(AdminEmailAlreadyExistsError);
	});

	it("rejects a duplicate created concurrently", async () => {
		const attempts = await Promise.allSettled([
			executeAdmin({
				email: "admin@example.com",
				name: "Admin",
				surname: "Admin Surname",
				password: "secure-password",
			}),
			executeAdmin({
				email: "admin@example.com",
				name: "Admin",
				surname: "Admin Surname",
				password: "secure-password",
			}),
		]);

		expect(
			attempts.filter((attempt) => attempt.status === "fulfilled"),
		).toHaveLength(1);
		const rejectedAttempt = attempts.find(
			(attempt) => attempt.status === "rejected",
		);
		expect(rejectedAttempt).toMatchObject({
			status: "rejected",
			reason: expect.any(AdminEmailAlreadyExistsError),
		});
	});

	it("rejects invalid input before querying the database", async () => {
		const findByEmailSpy = vi.spyOn(playerRepository, "findByEmail");
		const createAdminSpy = vi.spyOn(adminRepository, "createAdmin");

		await expect(
			executeAdmin({
				email: "admin@example.com",
				name: "Admin",
				surname: "Admin Surname",
				password: "short",
			}),
		).rejects.toBeInstanceOf(InvalidAdminRequestError);
		expect(findByEmailSpy).not.toHaveBeenCalled();
		expect(createAdminSpy).not.toHaveBeenCalled();
	});

	it("rejects an empty surname before querying the database", async () => {
		const findByEmailSpy = vi.spyOn(playerRepository, "findByEmail");
		const createAdminSpy = vi.spyOn(adminRepository, "createAdmin");
		const input = {
			email: "admin@example.com",
			name: "Admin",
			surname: "",
			password: "secure-password",
		};

		await expect(executeAdmin(input)).rejects.toBeInstanceOf(
			InvalidAdminRequestError,
		);
		expect(findByEmailSpy).not.toHaveBeenCalled();
		expect(createAdminSpy).not.toHaveBeenCalled();
	});
});
