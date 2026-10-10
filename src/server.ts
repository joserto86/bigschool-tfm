import dotenv from "dotenv";
import { createApp } from "./app";

dotenv.config();

const PORT = process.env.PORT || 3000;
const DATABASE_TYPE = process.env.DATABASE_TYPE || 'In Memory';

async function startServer() {
	try {
		const app = createApp();
	

		app.listen(PORT, () => {
			console.log(`Server is running on http://localhost:${PORT}`);
			console.log(
				`Using ${DATABASE_TYPE} repository`,
			);
			console.log(process.env.DATABASE_URL);
		});

	} catch (error) {
		console.error("Failed to start server:", error);
		process.exit(1);
	}
}

startServer();
