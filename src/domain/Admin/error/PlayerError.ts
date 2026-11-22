export class InvalidAdminPlayerRequestError extends Error {
	constructor() {
		super("The player request is invalid.");
		this.name = "InvalidAdminPlayerRequestError";
	}
}

export class AdminPlayerNotFoundError extends Error {
	constructor() {
		super("Player was not found.");
		this.name = "AdminPlayerNotFoundError";
	}
}

export class AdminPlayerConflictError extends Error {
	constructor() {
		super("A player with this email or nickname already exists.");
		this.name = "AdminPlayerConflictError";
	}
}
