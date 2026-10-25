import { z } from "zod";
import { IAdminRepository } from "../../infrastructure/persistence/Admin/IAdminRepository";
import { hashPassword } from "../Auth/Util/Password";
import { IPlayerRepository } from "../../infrastructure/persistence/Player/IPlayerRepository";
import {
	AdminEmailAlreadyExistsError,
	InvalidAdminRequestError,
} from "./error/AdminError";
import { MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } from "../Auth/Constants";
import { CreateAdminInputDto } from "./dto/CreateAdminInputDto";

const emailSchema = z.string().trim().toLowerCase().pipe(z.email());
const nameSchema = z.string().trim().min(1);
const passwordSchema = z
	.string()
	.min(MIN_PASSWORD_LENGTH)
	.max(MAX_PASSWORD_LENGTH);

export class CreateAdminUseCase {
	constructor(
		private readonly adminRepository: IAdminRepository,
		private readonly playerRepository: IPlayerRepository,
	) {}

	async execute(input: CreateAdminInputDto): Promise<{ email: string }> {
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
