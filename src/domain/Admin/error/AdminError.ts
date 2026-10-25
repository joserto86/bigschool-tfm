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
