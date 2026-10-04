import request from "supertest";
import { Application } from "express";
import { SignJWT } from "jose";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../app";

const JWT_SECRET = "players-test-secret-with-at-least-32-bytes";

async function createAccessToken(): Promise<string> {
	return new SignJWT({})
		.setProtectedHeader({ alg: "HS256" })
		.setSubject("test-player")
		.setIssuer("satispadel-api")
		.setAudience("satispadel-client")
		.setIssuedAt()
		.setExpirationTime("15m")
		.sign(Buffer.from(JWT_SECRET, "utf8"));
}

describe("Players API", () => {
	let app: Application;
	let authorization: string;

	beforeEach(async () => {
		vi.stubEnv("JWT_SECRET", JWT_SECRET);
		app = createApp();
		authorization = `Bearer ${await createAccessToken()}`;
	});

	afterEach(() => {
		vi.unstubAllEnvs();
	});

	async function createMatch(dateTime = "2026-10-10T18:00:00+02:00") {
		const response = await request(app)
			.post("/matches")
			.set("Authorization", authorization).send({ dateTime });
		return response.body.id as string;
	}

	describe("POST /matches/{matchId}/players", () => {
		it("rejects a request without a valid access token", async () => {
			const missing = await request(app)
				.post("/matches/any-match/players")
				.send({ playerId: "player-1" });
			const invalid = await request(app)
				.post("/matches/any-match/players")
				.set("Authorization", "Bearer invalid-token")
				.send({ playerId: "player-1" });

			expect(missing.status).toBe(401);
			expect(invalid.status).toBe(401);
			expect(missing.body.code).toBe("AUTHENTICATION_FAILED");
		});

		it("registers a player in the first free slot", async () => {
			const matchId = await createMatch();

			const response = await request(app)
				.post(`/matches/${matchId}/players`)
				.set("Authorization", authorization)
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
					.set("Authorization", authorization)
					.send({ playerId });
			}

			const response = await request(app)
				.post(`/matches/${matchId}/players`)
				.set("Authorization", authorization)
				.send({ playerId: "player-4" });

			expect(response.status).toBe(201);
			expect(response.body.matchStatus).toBe("COMPLETED");
		});

		it("rejects a player already registered in the match", async () => {
			const matchId = await createMatch();
			await request(app)
				.post(`/matches/${matchId}/players`)
				.set("Authorization", authorization)
				.send({ playerId: "player-1" });

			const response = await request(app)
				.post(`/matches/${matchId}/players`)
				.set("Authorization", authorization)
				.send({ playerId: "player-1" });

			expect(response.status).toBe(409);
			expect(response.body.code).toBe("PLAYER_ALREADY_REGISTERED");
		});

		it("rejects joining a full match", async () => {
			const matchId = await createMatch();
			for (const playerId of ["player-1", "player-2", "player-3", "player-4"]) {
				await request(app)
					.post(`/matches/${matchId}/players`)
					.set("Authorization", authorization)
					.send({ playerId });
			}

			const response = await request(app)
				.post(`/matches/${matchId}/players`)
				.set("Authorization", authorization)
				.send({ playerId: "player-5" });

			expect(response.status).toBe(409);
			expect(response.body.code).toBe("MATCH_FULL");
		});

		it("returns 404 when the match does not exist", async () => {
			const response = await request(app)
				.post("/matches/does-not-exist/players")
				.set("Authorization", authorization)
				.send({ playerId: "player-1" });

			expect(response.status).toBe(404);
		});
	});

	describe("DELETE /matches/{matchId}/players/{playerId}", () => {
		it("removes the player registration from an OPEN match", async () => {
			const matchId = await createMatch();
			await request(app)
				.post(`/matches/${matchId}/players`)
				.set("Authorization", authorization)
				.send({ playerId: "player-1" });
			await request(app)
				.post(`/matches/${matchId}/players`)
				.set("Authorization", authorization)
				.send({ playerId: "player-2" });

			const response = await request(app)
				.delete(
				`/matches/${matchId}/players/player-1`,
			)
				.set("Authorization", authorization);

			expect(response.status).toBe(204);

			const match = await request(app)
				.get(`/matches/${matchId}`)
				.set("Authorization", authorization);
			expect(match.body.players).not.toContainEqual(
				expect.objectContaining({ playerId: "player-1" }),
			);
		});

		it("deletes the match entirely when the last player leaves", async () => {
			const matchId = await createMatch();
			await request(app)
				.post(`/matches/${matchId}/players`)
				.set("Authorization", authorization)
				.send({ playerId: "player-1" });

			await request(app)
				.delete(`/matches/${matchId}/players/player-1`)
				.set("Authorization", authorization);

			const match = await request(app)
				.get(`/matches/${matchId}`)
				.set("Authorization", authorization);
			expect(match.status).toBe(404);
		});

		it("rejects leaving a match that is not OPEN", async () => {
			const matchId = await createMatch();
			for (const playerId of ["player-1", "player-2", "player-3", "player-4"]) {
				await request(app)
					.post(`/matches/${matchId}/players`)
					.set("Authorization", authorization)
					.send({ playerId });
			}

			const response = await request(app)
				.delete(
				`/matches/${matchId}/players/player-1`,
			)
				.set("Authorization", authorization);

			expect(response.status).toBe(409);
		});

		it("returns 404 when the player is not registered in the match", async () => {
			const matchId = await createMatch();

			const response = await request(app)
				.delete(
				`/matches/${matchId}/players/player-99`,
			)
				.set("Authorization", authorization);

			expect(response.status).toBe(404);
		});
	});
});