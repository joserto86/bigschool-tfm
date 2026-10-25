import request from "supertest";
import { Application } from "express";
import { SignJWT } from "jose";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../app";

const JWT_SECRET = "confirmations-test-secret-with-at-least-32-bytes";

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
		authorization = await createAuthorization("player-1");
	});

	afterEach(() => {
		vi.unstubAllEnvs();
	});

	async function createCompletedMatch() {
		const created = await request(app)
			.post("/matches")
			.set("Authorization", authorization)
			.send({ dateTime: new Date(Date.now() + 3600 * 1000).toISOString() });
		const matchId = created.body.id as string;

		for (const playerId of ["player-2", "player-3", "player-4"]) {
			await request(app)
				.post(`/matches/${matchId}/players`)
				.set("Authorization", await createAuthorization(playerId));
		}

		return matchId;
	}

	describe("POST /matches/{matchId}/confirmation", () => {
		it("rejects a request without a valid access token", async () => {
			const missing = await request(app)
				.post("/matches/any-match/confirmation")
				.send({ decision: "CONFIRMED" });
			const invalid = await request(app)
				.post("/matches/any-match/confirmation")
				.set("Authorization", "Bearer invalid-token")
				.send({ decision: "CONFIRMED" });

			expect(missing.status).toBe(401);
			expect(invalid.status).toBe(401);
			expect(missing.body.code).toBe("AUTHENTICATION_FAILED");
		});

		it("keeps the match COMPLETED while confirmations are pending", async () => {
			const matchId = await createCompletedMatch();

			const response = await request(app)
				.post(`/matches/${matchId}/confirmation`)
				.set("Authorization", authorization)
				.send({ decision: "CONFIRMED" });

			expect(response.status).toBe(200);
			expect(response.body).toMatchObject({
				matchId,
				playerId: "player-1",
				decision: "CONFIRMED",
				matchStatus: "COMPLETED",
			});
		});

		it("transitions the match to CONFIRMED once all four players confirm", async () => {
			const matchId = await createCompletedMatch();

			let response;
			for (const playerId of ["player-1", "player-2", "player-3", "player-4"]) {
				response = await request(app)
					.post(`/matches/${matchId}/confirmation`)
					.set("Authorization", await createAuthorization(playerId))
					.send({ decision: "CONFIRMED" });
			}

			expect(response?.status).toBe(200);
			expect(response?.body.matchStatus).toBe("CONFIRMED");
		});

		it("transitions the match to CANCELLED as soon as one player declines", async () => {
			const matchId = await createCompletedMatch();
			await request(app)
				.post(`/matches/${matchId}/confirmation`)
				.set("Authorization", await createAuthorization("player-1"))
				.send({ decision: "CONFIRMED" });

			const response = await request(app)
				.post(`/matches/${matchId}/confirmation`)
				.set("Authorization", await createAuthorization("player-2"))
				.send({ decision: "DECLINED" });

			expect(response.status).toBe(200);
			expect(response.body.matchStatus).toBe("CANCELLED");
		});

		it("rejects confirming a match that is not COMPLETED", async () => {
			const created = await request(app)
				.post("/matches")
				.set("Authorization", authorization)
				.send({ dateTime: new Date(Date.now() + 3600 * 1000).toISOString() });

			const response = await request(app)
				.post(`/matches/${created.body.id}/confirmation`)
				.set("Authorization", authorization)
				.send({ decision: "CONFIRMED" });

			expect(response.status).toBe(409);
		});

		it("rejects a decision from a player that does not belong to the match", async () => {
			const matchId = await createCompletedMatch();

			const response = await request(app)
				.post(`/matches/${matchId}/confirmation`)
				.set("Authorization", await createAuthorization("player-99"))
				.send({ decision: "CONFIRMED" });

			expect(response.status).toBe(409);
		});

		it("returns 404 when the match does not exist", async () => {
			const response = await request(app)
				.post("/matches/does-not-exist/confirmation")
				.set("Authorization", authorization)
				.send({ decision: "CONFIRMED" });

			expect(response.status).toBe(404);
		});
	});
});