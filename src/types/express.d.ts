declare global {
	namespace Express {
		interface Request {
			auth?: { playerId: string };
		}
	}
}

export {};
