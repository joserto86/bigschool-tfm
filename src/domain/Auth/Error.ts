export class InvalidPasswordRequestError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "InvalidPasswordRequestError";
	}
}

export class InvalidLoginRequestError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "InvalidLoginRequestError";
	}
}

export class AuthenticationFailedError extends Error {
  constructor() {
    super("Authentication failed.");
    this.name = "AuthenticationFailedError";
  }
}