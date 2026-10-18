declare global {
	namespace Express {
		interface Request {
			auth?: { playerId: string; isAdmin: boolean };
		}
	}
}

export {};
