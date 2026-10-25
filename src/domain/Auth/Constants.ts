export const MIN_PASSWORD_LENGTH = Number.parseInt(
	process.env.MIN_PASSWORD_LENGTH ?? "8",
	10,
);

export const MAX_PASSWORD_LENGTH = Number.parseInt(
	process.env.MAX_PASSWORD_LENGTH ?? "128",
	10,
);

export const ACCESS_TOKEN_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN
	? Number.parseInt(process.env.ACCESS_TOKEN_EXPIRES_IN, 10)
	: 900;

export const REFRESH_TOKEN_EXPIRES_IN_SECONDS = process.env
	.REFRESH_TOKEN_EXPIRES_IN_SECONDS
	? Number.parseInt(process.env.REFRESH_TOKEN_EXPIRES_IN_SECONDS, 10)
	: 30 * 24 * 60 * 60;