import request from "supertest";
import { Application } from "express";
import { SignJWT } from "jose";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../app";

const JWT_SECRET = "admin-matches-test-secret-with-32-bytes";
const MATCH_DATE_TIME = () => new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";
type MatchStatus = "OPEN" | "COMPLETED" | "CONFIRMED" | "CANCELLED";

async function createAccessToken(isAdmin: boolean, playerId: string): Promise<string> {
	return new SignJWT({ isAdmin })
		.setProtectedHeader({ alg: "HS256" })
		.setSubject(playerId)
		.setIssuer("satispadel-api")
		.setAudience("satispadel-client")
		.setIssuedAt()
		.setExpirationTime("15m")
		.sign(Buffer.from(JWT_SECRET, "utf8"));
}

describe("Admin Matches API", () => {
	let app: Application;
	let adminAuthorization: string;
	let playerAuthorization: string;
	let playerCounter: number;

	beforeEach(async () => {
		vi.stubEnv("JWT_SECRET", JWT_SECRET);
		app = createApp();
		adminAuthorization = `Bearer ${await createAccessToken(true, "test-admin")}`;
		playerAuthorization = `Bearer ${await createAccessToken(false, "test-player")}`;
		playerCounter = 0;
	});

	afterEach(() => {
		vi.unstubAllEnvs();
	});

	function requestFor(method: HttpMethod, path: string) {
		switch (method) {
			case "GET":
				return request(app).get(path);
			case "POST":
				return request(app).post(path);
			case "PATCH":
				return request(app).patch(path);
			case "DELETE":
				return request(app).delete(path);
		}
	}

	async function createAdminMatch() {
		const response = await request(app)
			.post("/admin/matches")
			.set("Authorization", adminAuthorization)
			.send({ dateTime: MATCH_DATE_TIME() });

		expect(response.status).toBe(201);
		return response.body as {
			id: string;
			dateTime: string;
			status: MatchStatus;
			players: Array<{ playerId: string; slot: number; confirmation: string | null }>;
		};
	}

	async function createPlayer() {
		playerCounter += 1;
		const response = await request(app)
			.post("/admin/players")
			.set("Authorization", adminAuthorization)
			.send({
				name: `Player ${playerCounter}`,
				email: `player-${playerCounter}@example.com`,
				password: "secure-password",
				phone: `+34600000${String(playerCounter).padStart(3, "0")}`,
				active: true,
			});

		expect(response.status).toBe(201);
		return response.body.id as string;
	}

	async function createCompletedMatch() {
		const playerIds = ["test-player", "match-player-2", "match-player-3", "match-player-4"];
		const created = await request(app)
			.post("/matches")
			.set("Authorization", playerAuthorization)
			.send({ dateTime: MATCH_DATE_TIME() });

		expect(created.status).toBe(201);
		for (const playerId of playerIds.slice(1)) {
			const authorization = `Bearer ${await createAccessToken(false, playerId)}`;
			const joined = await request(app)
				.post(`/matches/${created.body.id}/players`)
				.set("Authorization", authorization);
			expect(joined.status).toBe(201);
		}

		return { matchId: created.body.id as string, playerIds };
	}

	async function changeMatchStatus(matchId: string, status: MatchStatus) {
		return request(app)
			.patch(`/admin/matches/${matchId}/status`)
			.set("Authorization", adminAuthorization)
			.send({ status });
	}

	describe("administrative access", () => {
		const protectedOperations: Array<[HttpMethod, string]> = [
			["GET", "/admin/matches"],
			["POST", "/admin/matches"],
			["GET", "/admin/matches/match-123"],
			["DELETE", "/admin/matches/match-123"],
			["POST", "/admin/matches/match-123/players"],
			["DELETE", "/admin/matches/match-123/players/player-123"],
			["PATCH", "/admin/matches/match-123/status"],
		];

		it.each(protectedOperations)(
			"requires authentication for %s %s",
			async (method, path) => {
				const response = await requestFor(method, path);

				expect(response.status).toBe(401);
				expect(response.body).toMatchObject({
					code: "AUTHENTICATION_FAILED",
					message: expect.any(String),
				});
			},
		);

		it.each(protectedOperations)(
			"forbids non-admin access to %s %s",
			async (method, path) => {
				const response = await requestFor(method, path).set(
					"Authorization",
					playerAuthorization,
				);

				expect(response.status).toBe(403);
				expect(response.body).toMatchObject({
					code: "FORBIDDEN",
					message: expect.any(String),
				});
			},
		);
	});

	describe("POST /admin/matches", () => {
		it("creates an OPEN match without registered players", async () => {
			const dateTime = MATCH_DATE_TIME();
			const response = await request(app)
				.post("/admin/matches")
				.set("Authorization", adminAuthorization)
				.send({ dateTime });

			expect(response.status).toBe(201);
			expect(response.body).toMatchObject({
				dateTime,
				status: "OPEN",
				players: [],
			});
			expect(response.body.id).toEqual(expect.any(String));
		});

		it("rejects a missing or invalid dateTime", async () => {
			const missing = await request(app)
				.post("/admin/matches")
				.set("Authorization", adminAuthorization)
				.send({});
			const invalid = await request(app)
				.post("/admin/matches")
				.set("Authorization", adminAuthorization)
				.send({ dateTime: "not-a-date" });

			expect(missing.status).toBe(400);
			expect(missing.body).toMatchObject({
				code: "INVALID_REQUEST",
				message: expect.any(String),
			});
			expect(invalid.status).toBe(400);
			expect(invalid.body).toMatchObject({
				code: "INVALID_REQUEST",
				message: expect.any(String),
			});
		});
	});

	describe("GET /admin/matches", () => {
		it("returns all matches in the documented items response", async () => {
			const first = await createAdminMatch();
			const second = await createAdminMatch();

			const response = await request(app)
				.get("/admin/matches")
				.set("Authorization", adminAuthorization);

			expect(response.status).toBe(200);
			expect(response.body.items).toEqual(
				expect.arrayContaining([
					expect.objectContaining({ id: first.id, status: "OPEN", players: [] }),
					expect.objectContaining({ id: second.id, status: "OPEN", players: [] }),
				]),
			);
		});
	});

	describe("GET /admin/matches/{matchId}", () => {
		it("returns the requested match and reports an unknown match", async () => {
			const match = await createAdminMatch();
			const found = await request(app)
				.get(`/admin/matches/${match.id}`)
				.set("Authorization", adminAuthorization);
			const missing = await request(app)
				.get("/admin/matches/unknown-match")
				.set("Authorization", adminAuthorization);

			expect(found.status).toBe(200);
			expect(found.body).toMatchObject({
				id: match.id,
				dateTime: match.dateTime,
				status: "OPEN",
				players: [],
			});
			expect(missing.status).toBe(404);
			expect(missing.body).toMatchObject({
				code: "MATCH_NOT_FOUND",
				message: expect.any(String),
			});
		});
	});

	describe("POST /admin/matches/{matchId}/players", () => {
		it("registers an existing player in the next slot", async () => {
			const match = await createAdminMatch();
			const playerId = await createPlayer();

			const response = await request(app)
				.post(`/admin/matches/${match.id}/players`)
				.set("Authorization", adminAuthorization)
				.send({ playerId });

			expect(response.status).toBe(201);
			expect(response.body).toMatchObject({
				id: match.id,
				status: "OPEN",
				players: [{ playerId, slot: 1, confirmation: null }],
			});
		});

		it("transitions to COMPLETED when the fourth player is registered", async () => {
			const match = await createAdminMatch();
			const playerIds = await Promise.all(
				Array.from({ length: 4 }, () => createPlayer()),
			);
			let response;

			for (const playerId of playerIds) {
				response = await request(app)
					.post(`/admin/matches/${match.id}/players`)
					.set("Authorization", adminAuthorization)
					.send({ playerId });
			}

			expect(response?.status).toBe(201);
			expect(response?.body.status).toBe("COMPLETED");
			expect(response?.body.players).toHaveLength(4);
		});

		it("rejects duplicate players and registrations when the match is not OPEN", async () => {
			const match = await createAdminMatch();
			const playerId = await createPlayer();
			const first = await request(app)
				.post(`/admin/matches/${match.id}/players`)
				.set("Authorization", adminAuthorization)
				.send({ playerId });
			const duplicate = await request(app)
				.post(`/admin/matches/${match.id}/players`)
				.set("Authorization", adminAuthorization)
				.send({ playerId });

			expect(first.status).toBe(201);
			expect(duplicate.status).toBe(409);
			expect(duplicate.body).toMatchObject({
				code: "PLAYER_ALREADY_REGISTERED",
				message: expect.any(String),
			});

			const completed = await createCompletedMatch();
			const anotherPlayer = await createPlayer();
			const notOpen = await request(app)
				.post(`/admin/matches/${completed.matchId}/players`)
				.set("Authorization", adminAuthorization)
				.send({ playerId: anotherPlayer });

			expect(notOpen.status).toBe(409);
			expect(notOpen.body).toMatchObject({
				code: "MATCH_NOT_OPEN",
				message: expect.any(String),
			});
		});

		it("rejects invalid requests, unknown players, and full matches", async () => {
			const match = await createAdminMatch();
			const invalid = await request(app)
				.post(`/admin/matches/${match.id}/players`)
				.set("Authorization", adminAuthorization)
				.send({});
			const unknownPlayer = await request(app)
				.post(`/admin/matches/${match.id}/players`)
				.set("Authorization", adminAuthorization)
				.send({ playerId: "unknown-player" });

			expect(invalid.status).toBe(400);
			expect(invalid.body).toMatchObject({
				code: "INVALID_REQUEST",
				message: expect.any(String),
			});
			expect(unknownPlayer.status).toBe(404);
			expect(unknownPlayer.body).toMatchObject({
				code: expect.any(String),
				message: expect.any(String),
			});

			const completed = await createCompletedMatch();
			const playerId = await createPlayer();
			const full = await request(app)
				.post(`/admin/matches/${completed.matchId}/players`)
				.set("Authorization", adminAuthorization)
				.send({ playerId });

			expect(full.status).toBe(409);
			expect(full.body).toMatchObject({
				code: expect.any(String),
				message: expect.any(String),
			});
		});
	});

	describe("DELETE /admin/matches/{matchId}/players/{playerId}", () => {
		it("removes a player, reopens the match, and resets remaining confirmations", async () => {
			const { matchId, playerIds } = await createCompletedMatch();
			const confirmed = await request(app)
				.post(`/matches/${matchId}/confirmation`)
				.set(
					"Authorization",
					`Bearer ${await createAccessToken(false, playerIds[0])}`,
				)
				.send({ decision: "CONFIRMED" });
			expect(confirmed.status).toBe(200);

			const response = await request(app)
				.delete(`/admin/matches/${matchId}/players/${playerIds[1]}`)
				.set("Authorization", adminAuthorization);

			expect(response.status).toBe(200);
			expect(response.body).toMatchObject({
				id: matchId,
				status: "OPEN",
			});
			expect(response.body.players).toHaveLength(3);
			expect(response.body.players).not.toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						playerId: playerIds[0],
						confirmation: "CONFIRMED",
					}),
				]),
			);
		});

		it.each(["CONFIRMED", "CANCELLED"] as const)(
			"rejects removal while the match is %s",
			async (status) => {
				const { matchId, playerIds } = await createCompletedMatch();
				const changed = await changeMatchStatus(matchId, status);
				expect(changed.status).toBe(200);

				const response = await request(app)
					.delete(`/admin/matches/${matchId}/players/${playerIds[0]}`)
					.set("Authorization", adminAuthorization);

				expect(response.status).toBe(409);
				expect(response.body).toMatchObject({
					code: expect.any(String),
					message: expect.any(String),
				});
			},
		);

		it("returns 404 when the match or registration does not exist", async () => {
			const match = await createAdminMatch();
			const missingMatch = await request(app)
				.delete("/admin/matches/unknown-match/players/player-123")
				.set("Authorization", adminAuthorization);
			const missingPlayer = await request(app)
				.delete(`/admin/matches/${match.id}/players/unknown-player`)
				.set("Authorization", adminAuthorization);

			expect(missingMatch.status).toBe(404);
			expect(missingMatch.body).toMatchObject({
				code: "MATCH_NOT_FOUND",
				message: expect.any(String),
			});
			expect(missingPlayer.status).toBe(404);
			expect(missingPlayer.body).toMatchObject({
				code: expect.any(String),
				message: expect.any(String),
			});
		});
	});

	describe("PATCH /admin/matches/{matchId}/status", () => {
		it("transitions an OPEN match to CANCELLED", async () => {
			const match = await createAdminMatch();

			const response = await changeMatchStatus(match.id, "CANCELLED");

			expect(response.status).toBe(200);
			expect(response.body).toMatchObject({
				id: match.id,
				status: "CANCELLED",
			});
		});

		it.each([
			["COMPLETED", "CONFIRMED"],
			["COMPLETED", "CANCELLED"],
			["CONFIRMED", "CANCELLED"],
			["CONFIRMED", "COMPLETED"],
			["CANCELLED", "COMPLETED"],
		] as const)(
			"transitions from %s to %s",
			async (initialStatus, nextStatus) => {
				const { matchId } = await createCompletedMatch();
				if (initialStatus !== "COMPLETED") {
					const initial = await changeMatchStatus(matchId, initialStatus);
					expect(initial.status).toBe(200);
				}

				const response = await changeMatchStatus(matchId, nextStatus);

				expect(response.status).toBe(200);
				expect(response.body).toMatchObject({
					id: matchId,
					status: nextStatus,
				});
			},
		);

		it("rejects COMPLETED when fewer than four players are registered", async () => {
			const match = await createAdminMatch();

			const response = await changeMatchStatus(match.id, "COMPLETED");

			expect(response.status).toBe(409);
			expect(response.body).toMatchObject({
				code: expect.any(String),
				message: expect.any(String),
			});
		});

		it("rejects invalid statuses and transitions", async () => {
			const match = await createAdminMatch();
			const invalid = await request(app)
				.patch(`/admin/matches/${match.id}/status`)
				.set("Authorization", adminAuthorization)
				.send({ status: "INVALID" });
			const invalidTransition = await changeMatchStatus(match.id, "CONFIRMED");

			expect(invalid.status).toBe(400);
			expect(invalid.body).toMatchObject({
				code: "INVALID_REQUEST",
				message: expect.any(String),
			});
			expect(invalidTransition.status).toBe(409);
			expect(invalidTransition.body).toMatchObject({
				code: expect.any(String),
				message: expect.any(String),
			});
		});

		it("returns 404 when the match does not exist", async () => {
			const response = await changeMatchStatus("unknown-match", "COMPLETED");

			expect(response.status).toBe(404);
			expect(response.body).toMatchObject({
				code: "MATCH_NOT_FOUND",
				message: expect.any(String),
			});
		});
	});

	describe("DELETE /admin/matches/{matchId}", () => {
		it.each(["OPEN", "COMPLETED", "CONFIRMED", "CANCELLED"] as const)(
			"deletes a match in %s state",
			async (status) => {
				let matchId: string;
				if (status === "OPEN") {
					matchId = (await createAdminMatch()).id;
				} else {
					matchId = (await createCompletedMatch()).matchId;
					if (status === "CONFIRMED" || status === "CANCELLED") {
						const changed = await changeMatchStatus(matchId, status);
						expect(changed.status).toBe(200);
					}
				}

				const deleted = await request(app)
					.delete(`/admin/matches/${matchId}`)
					.set("Authorization", adminAuthorization);
				const missing = await request(app)
					.delete(`/admin/matches/${matchId}`)
					.set("Authorization", adminAuthorization);

				expect(deleted.status).toBe(204);
				expect(deleted.body).toEqual({});
				expect(missing.status).toBe(404);
				expect(missing.body).toMatchObject({
					code: "MATCH_NOT_FOUND",
					message: expect.any(String),
				});
			},
		);
	});
});
