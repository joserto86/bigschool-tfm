import { NextFunction, Request, RequestHandler, Response } from "express";
import { jwtVerify } from "jose";
import { jwtAudience, jwtIssuer } from "../domain/Auth/jwtConfig";
import { AuthenticationFailedError } from "../domain/Auth/LoginUseCase";

export function createAuthenticateMiddleware(
	signingKey: Uint8Array,
): RequestHandler {
	return async (req: Request, res: Response, next: NextFunction) => {
		try {
			const authorization = req.header("authorization") ?? "";
			const separator = authorization.indexOf(" ");
			const scheme = separator > 0 ? authorization.slice(0, separator) : "";
			const token = separator > 0 ? authorization.slice(separator).trim() : "";
			if (scheme.toLowerCase() !== "bearer" || !token) {
				throw new AuthenticationFailedError();
			}
			const { payload } = await jwtVerify(token, signingKey, {
				algorithms: ["HS256"],
				issuer: jwtIssuer(),
				audience: jwtAudience(),
			});
			if (!payload.sub) {
				throw new AuthenticationFailedError();
			}
			req.auth = { playerId: payload.sub };
			next();
		} catch {
			res.status(401).json({
				code: "AUTHENTICATION_FAILED",
				message: new AuthenticationFailedError().message,
			});
		}
	};
}
