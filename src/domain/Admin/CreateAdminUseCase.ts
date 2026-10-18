import { z } from "zod";
import { IAdminRepository } from "../../infrastructure/persistence/Admin/IAdminRepository";
import { hashPassword } from "../Auth/Password";
import { IPlayerRepository } from "../../infrastructure/persistence/Player/IPlayerRepository";

const MIN_PASSWORD_LENGTH = Number.parseInt(process.env.MIN_PASSWORD_LENGTH ?? "8", 10);
const MAX_PASSWORD_LENGTH = Number.parseInt(process.env.MAX_PASSWORD_LENGTH ?? "128", 10);

const emailSchema = z.string().trim().toLowerCase().pipe(z.email());
const nameSchema = z.string().trim().min(1);
const passwordSchema = z.string().min(MIN_PASSWORD_LENGTH).max(MAX_PASSWORD_LENGTH);

export interface CreateAdminInput {
	email: string;
	name: string;
	password: string;
}

export class InvalidAdminRequestError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "InvalidAdminRequestError";
	}
}

export class AdminEmailAlreadyExistsError extends Error {
	constructor() {
		super("A user with this email already exists.");
		this.name = "AdminEmailAlreadyExistsError";
	}
}

export class CreateAdminUseCase {
	constructor(private readonly adminRepository: IAdminRepository,
							private readonly playerRepository: IPlayerRepository
	) { }

	async execute(input: CreateAdminInput): Promise<{ email: string }> {
		const email = emailSchema.safeParse(input.email);
		if (!email.success) {
			throw new InvalidAdminRequestError("Enter a valid email address.");
		}

		const name = nameSchema.safeParse(input.name);
		if (!name.success) {
			throw new InvalidAdminRequestError("Name cannot be empty.");
		}

		const password = passwordSchema.safeParse(input.password);
		if (!password.success) {
			throw new InvalidAdminRequestError(
				`Password must be between ${MIN_PASSWORD_LENGTH} and ${MAX_PASSWORD_LENGTH} characters.`,
			);
		}

		if (await this.playerRepository.findByEmail(email.data)) {
			throw new AdminEmailAlreadyExistsError();
		}

		const passwordHash = await hashPassword(password.data);
		const created = await this.adminRepository.createAdmin({
			email: email.data,
			name: name.data,
			passwordHash,
			isAdmin: true,
			active: true,
		});
		if (!created) {
			throw new AdminEmailAlreadyExistsError();
		}

		return { email: email.data };
	}
}
