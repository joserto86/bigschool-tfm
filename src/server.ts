import { Request, Response } from "express";
import { createApp } from "./app";

const PORT = process.env.PORT || 3000;
const DATABASE_TYPE = process.env.DATABASE_TYPE || 'In Memory';

async function startServer() {
	try {
		const app = createApp();

		app.get("/", (_req: Request, res: Response) => {
			res.send("Hello World");
		});

		app.listen(PORT, () => {
			console.log(`Server is running on http://localhost:${PORT}`);
			console.log(
				`Using ${DATABASE_TYPE} repository`,
			);
		});

	} catch (error) {
		console.error("Failed to start server:", error);
		process.exit(1);
	}
}

startServer();
