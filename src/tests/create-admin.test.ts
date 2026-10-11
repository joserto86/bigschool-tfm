import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	AdminEmailAlreadyExistsError,
	CreateAdminUseCase,
	InvalidAdminRequestError,
} from "../domain/Admin/CreateAdminUseCase.js";
import { verifyPassword } from "../domain/Auth/Password.js";
import { InMemoryAdminRepository } from "../infrastructure/persistence/Admin/InMemoryAdminRepository.js";

describe("CreateAdminUseCase", () => {
	let adminRepository: InMemoryAdminRepository;
	let useCase: CreateAdminUseCase;

	beforeEach(() => {
		adminRepository = new InMemoryAdminRepository();
		useCase = new CreateAdminUseCase(adminRepository);
	});

	it("creates an active administrator with a normalized email and a password hash", async () => {
		const createAdminSpy = vi.spyOn(adminRepository, "createAdmin");
		const result = await useCase.execute({
			email: " ADMIN@EXAMPLE.COM ",
			name: " Ada Admin ",
			password: "secure-password",
		});

		const createCall = createAdminSpy.mock.calls[0]?.[0];
		expect(createCall).toMatchObject({
			email: "admin@example.com",
			name: "Ada Admin",
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
		await useCase.execute({
			email: "admin@example.com",
			name: "Admin",
			password: "secure-password",
		});

		await expect(
			useCase.execute({
				email: "admin@example.com",
				name: "Admin",
				password: "secure-password",
			}),
		).rejects.toBeInstanceOf(AdminEmailAlreadyExistsError);
	});

	it("rejects a duplicate created concurrently", async () => {
		const attempts = await Promise.allSettled([
			useCase.execute({
				email: "admin@example.com",
				name: "Admin",
				password: "secure-password",
			}),
			useCase.execute({
				email: "admin@example.com",
				name: "Admin",
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
		const findByEmailSpy = vi.spyOn(adminRepository, "findByEmail");
		const createAdminSpy = vi.spyOn(adminRepository, "createAdmin");

		await expect(
			useCase.execute({
				email: "admin@example.com",
				name: "Admin",
				password: "short",
			}),
		).rejects.toBeInstanceOf(InvalidAdminRequestError);
		expect(findByEmailSpy).not.toHaveBeenCalled();
		expect(createAdminSpy).not.toHaveBeenCalled();
	});
});
