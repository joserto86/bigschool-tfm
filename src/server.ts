import dotenv from "dotenv";
import { createApp } from "./app";

dotenv.config();

const PORT = process.env.PORT || 3000;

async function startServer() {
	try {
		const app = createApp(true);

		app.listen(PORT, () => {
			console.log(`Server is running on http://localhost:${PORT}`);
			console.log(process.env.DATABASE_URL);
		});

	} catch (error) {
		console.error("Failed to start server:", error);
		process.exit(1);
	}
}

startServer();
