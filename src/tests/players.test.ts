import request from "supertest";
import { Application } from "express";
import { beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../app";

describe("Players API", () => {
	let app: Application;

	beforeEach(() => {
		app = createApp();
	});

	async function createMatch(dateTime = "2026-10-10T18:00:00+02:00") {
		const response = await request(app).post("/matches").send({ dateTime });
		return response.body.id as string;
	}

	describe("POST /matches/{matchId}/players", () => {
		it("registers a player in the first free slot", async () => {
			const matchId = await createMatch();

			const response = await request(app)
				.post(`/matches/${matchId}/players`)
				.send({ playerId: "player-1" });

			expect(response.status).toBe(201);
			expect(response.body).toMatchObject({
				matchId,
				playerId: "player-1",
				slot: 1,
				matchStatus: "OPEN",
			});
		});

		it("transitions the match to COMPLETED when the fourth player joins", async () => {
			const matchId = await createMatch();

			for (const playerId of ["player-1", "player-2", "player-3"]) {
				await request(app)
					.post(`/matches/${matchId}/players`)
					.send({ playerId });
			}

			const response = await request(app)
				.post(`/matches/${matchId}/players`)
				.send({ playerId: "player-4" });

			expect(response.status).toBe(201);
			expect(response.body.matchStatus).toBe("COMPLETED");
		});

		it("rejects a player already registered in the match", async () => {
			const matchId = await createMatch();
			await request(app)
				.post(`/matches/${matchId}/players`)
				.send({ playerId: "player-1" });

			const response = await request(app)
				.post(`/matches/${matchId}/players`)
				.send({ playerId: "player-1" });

			expect(response.status).toBe(409);
			expect(response.body.code).toBe("PLAYER_ALREADY_REGISTERED");
		});

		it("rejects joining a full match", async () => {
			const matchId = await createMatch();
			for (const playerId of ["player-1", "player-2", "player-3", "player-4"]) {
				await request(app)
					.post(`/matches/${matchId}/players`)
					.send({ playerId });
			}

			const response = await request(app)
				.post(`/matches/${matchId}/players`)
				.send({ playerId: "player-5" });

			expect(response.status).toBe(409);
			expect(response.body.code).toBe("MATCH_FULL");
		});

		it("returns 404 when the match does not exist", async () => {
			const response = await request(app)
				.post("/matches/does-not-exist/players")
				.send({ playerId: "player-1" });

			expect(response.status).toBe(404);
		});
	});

	describe("DELETE /matches/{matchId}/players/{playerId}", () => {
		it("removes the player registration from an OPEN match", async () => {
			const matchId = await createMatch();
			await request(app)
				.post(`/matches/${matchId}/players`)
				.send({ playerId: "player-1" });
			await request(app)
				.post(`/matches/${matchId}/players`)
				.send({ playerId: "player-2" });

			const response = await request(app).delete(
				`/matches/${matchId}/players/player-1`,
			);

			expect(response.status).toBe(204);

			const match = await request(app).get(`/matches/${matchId}`);
			expect(match.body.players).not.toContainEqual(
				expect.objectContaining({ playerId: "player-1" }),
			);
		});

		it("deletes the match entirely when the last player leaves", async () => {
			const matchId = await createMatch();
			await request(app)
				.post(`/matches/${matchId}/players`)
				.send({ playerId: "player-1" });

			await request(app).delete(`/matches/${matchId}/players/player-1`);

			const match = await request(app).get(`/matches/${matchId}`);
			expect(match.status).toBe(404);
		});

		it("rejects leaving a match that is not OPEN", async () => {
			const matchId = await createMatch();
			for (const playerId of ["player-1", "player-2", "player-3", "player-4"]) {
				await request(app)
					.post(`/matches/${matchId}/players`)
					.send({ playerId });
			}

			const response = await request(app).delete(
				`/matches/${matchId}/players/player-1`,
			);

			expect(response.status).toBe(409);
		});

		it("returns 404 when the player is not registered in the match", async () => {
			const matchId = await createMatch();

			const response = await request(app).delete(
				`/matches/${matchId}/players/player-99`,
			);

			expect(response.status).toBe(404);
		});
	});
});