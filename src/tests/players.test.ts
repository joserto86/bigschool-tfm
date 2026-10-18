import request from "supertest";
import { Application } from "express";
import { SignJWT } from "jose";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../app";

const JWT_SECRET = "players-test-secret-with-at-least-32-bytes";

async function createAccessToken(playerId: string): Promise<string> {
	return new SignJWT({})
		.setProtectedHeader({ alg: "HS256" })
		.setSubject(playerId)
		.setIssuer("satispadel-api")
		.setAudience("satispadel-client")
		.setIssuedAt()
		.setExpirationTime("15m")
		.sign(Buffer.from(JWT_SECRET, "utf8"));
}

async function createAuthorization(playerId: string): Promise<string> {
	return `Bearer ${await createAccessToken(playerId)}`;
}

describe("Players API", () => {
	let app: Application;
	let authorization: string;

	beforeEach(async () => {
		vi.stubEnv("JWT_SECRET", JWT_SECRET);
		app = createApp();
		authorization = await createAuthorization("test-player");
	});

	afterEach(() => {
		vi.unstubAllEnvs();
	});

	async function createMatch(dateTime = new Date(Date.now() + 3600 * 1000).toISOString()) {
		const response = await request(app)
			.post("/matches")
			.set("Authorization", authorization).send({ dateTime });
		return response.body.id as string;
	}

	async function registerPlayer(matchId: string, playerId: string) {
		return request(app)
			.post(`/matches/${matchId}/players`)
			.set("Authorization", await createAuthorization(playerId));
	}

	describe("POST /matches/{matchId}/players", () => {
		it("rejects a request without a valid access token", async () => {
			const missing = await request(app)
				.post("/matches/any-match/players");
			const invalid = await request(app)
				.post("/matches/any-match/players")
				.set("Authorization", "Bearer invalid-token");

			expect(missing.status).toBe(401);
			expect(invalid.status).toBe(401);
			expect(missing.body.code).toBe("AUTHENTICATION_FAILED");
		});

		it("registers the authenticated player in the next free slot", async () => {
			const matchId = await createMatch();

			const response = await registerPlayer(matchId, "player-1");

			expect(response.status).toBe(201);
			expect(response.body).toMatchObject({
				matchId,
				playerId: "player-1",
				slot: 2,
				matchStatus: "OPEN",
				confirmation: null,
			});
		});

		it("transitions the match to COMPLETED when the fourth player joins", async () => {
			const matchId = await createMatch();

			for (const playerId of ["player-1", "player-2"]) {
				await registerPlayer(matchId, playerId);
			}

			const response = await registerPlayer(matchId, "player-3");

			expect(response.status).toBe(201);
			expect(response.body.matchStatus).toBe("COMPLETED");
		});

		it("rejects a player already registered in the match", async () => {
			const matchId = await createMatch();

			const response = await registerPlayer(matchId, "test-player");

			expect(response.status).toBe(409);
			expect(response.body.code).toBe("PLAYER_ALREADY_REGISTERED");
		});

		it("rejects joining a full match", async () => {
			const matchId = await createMatch();
			for (const playerId of ["player-1", "player-2", "player-3"]) {
				await registerPlayer(matchId, playerId);
			}

			const response = await registerPlayer(matchId, "player-4");

			expect(response.status).toBe(409);
			expect(response.body.code).toBe("MATCH_FULL");
		});

		it("returns 404 when the match does not exist", async () => {
			const response = await request(app)
				.post("/matches/does-not-exist/players")
				.set("Authorization", authorization);

			expect(response.status).toBe(404);
		});
	});

	describe("DELETE /matches/{matchId}/players", () => {
		it("removes the authenticated player's registration from an OPEN match", async () => {
			const matchId = await createMatch();
			await registerPlayer(matchId, "player-2");

			const response = await request(app)
				.delete(`/matches/${matchId}/players`)
				.set("Authorization", authorization);

			expect(response.status).toBe(204);

			const match = await request(app)
				.get(`/matches/${matchId}`)
				.set("Authorization", authorization);
			expect(match.body.players).not.toContainEqual(
				expect.objectContaining({ playerId: "test-player" }),
			);
		});

		it("deletes the match entirely when the last registered player leaves", async () => {
			const matchId = await createMatch();
			await request(app)
				.delete(`/matches/${matchId}/players`)
				.set("Authorization", authorization);

			const match = await request(app)
				.get(`/matches/${matchId}`)
				.set("Authorization", authorization);
			expect(match.status).toBe(404);
		});

		it("rejects leaving a match that is not OPEN", async () => {
			const matchId = await createMatch();
			for (const playerId of ["player-1", "player-2", "player-3"]) {
				await registerPlayer(matchId, playerId);
			}

			const response = await request(app)
				.delete(`/matches/${matchId}/players`)
				.set("Authorization", await createAuthorization("player-1"));

			expect(response.status).toBe(409);
		});

		it("returns 404 when the player is not registered in the match", async () => {
			const matchId = await createMatch();

			const response = await request(app)
				.delete(`/matches/${matchId}/players`)
				.set("Authorization", await createAuthorization("player-99"));

			expect(response.status).toBe(404);
		});
	});
});