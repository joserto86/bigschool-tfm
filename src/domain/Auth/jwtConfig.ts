export const jwtIssuer = (): string =>
	process.env.JWT_ISSUER ?? "satispadel-api";

export const jwtAudience = (): string =>
	process.env.JWT_AUDIENCE ?? "satispadel-client";
