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

export class AdminPlayerEmailConflictError extends Error {
	constructor() {
		super("A player with this email already exists.");
		this.name = "AdminPlayerEmailConflictError";
	}
}
