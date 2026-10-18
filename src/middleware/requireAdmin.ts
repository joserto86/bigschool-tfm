import { NextFunction, Request, RequestHandler, Response } from "express";

export const requireAdmin: RequestHandler = (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	if (req.auth?.isAdmin !== true) {
		res.status(403).json({
			code: "FORBIDDEN",
			message: "Administrator privileges are required.",
		});
		return;
	}
	next();
};
