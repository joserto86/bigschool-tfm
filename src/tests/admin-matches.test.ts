import request from "supertest";
import { Application } from "express";
import { SignJWT } from "jose";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../app";

const JWT_SECRET = "admin-matches-test-secret-with-32-bytes";
const MATCH_DATE_TIME = () =>
	new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
type MatchStatus = "OPEN" | "COMPLETED" | "CONFIRMED" | "CANCELLED";
type PlayerConfirmation = "PENDING" | "CONFIRMED" | "DECLINED";

interface MatchPlayerInput {
	id: string;
	slot: number;
	confirmation?: PlayerConfirmation;
}

interface MatchResponse {
	id: string;
	dateTime: string;
	status: MatchStatus;
	place?: string | null;
	players: Array<{
		id: string;
		name: string;
		slot: number;
		confirmation: PlayerConfirmation | null;
	}>;
}

async function createAccessToken(
	isAdmin: boolean,
	playerId: string,
): Promise<string> {
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
			case "PUT":
				return request(app).put(path);
			case "PATCH":
				return request(app).patch(path);
			case "DELETE":
				return request(app).delete(path);
		}
	}

	async function createPlayer(): Promise<{ id: string; name: string }> {
		playerCounter += 1;
		const name = `Player ${playerCounter}`;
		const response = await request(app)
			.post("/api/admin/players")
			.set("Authorization", adminAuthorization)
			.send({
				name,
				email: `player-${playerCounter}@example.com`,
				password: "secure-password",
				phone: `+34600000${String(playerCounter).padStart(3, "0")}`,
				active: true,
			});

		expect(response.status).toBe(201);
		return { id: response.body.id as string, name };
	}

	async function createAdminMatch(
		input: {
			dateTime?: string;
			place?: string | null;
			players?: MatchPlayerInput[];
		} = {},
	): Promise<MatchResponse> {
		const response = await request(app)
			.post("/api/admin/matches")
			.set("Authorization", adminAuthorization)
			.send({
				dateTime: input.dateTime ?? MATCH_DATE_TIME(),
				...(input.place === undefined ? {} : { place: input.place }),
				...(input.players === undefined ? {} : { players: input.players }),
			});

		expect(response.status).toBe(201);
		return response.body as MatchResponse;
	}

	async function createCompletedMatch(): Promise<{
		matchId: string;
		playerIds: string[];
	}> {
		const players = await Promise.all(
			Array.from({ length: 4 }, () => createPlayer()),
		);
		const match = await createAdminMatch({
			players: players.map((player, index) => ({
				id: player.id,
				slot: index + 1,
				confirmation: "CONFIRMED",
			})),
		});

		expect(match.status).toBe("COMPLETED");
		return { matchId: match.id, playerIds: players.map(({ id }) => id) };
	}

	async function changeMatchStatus(matchId: string, status: MatchStatus) {
		return request(app)
			.patch(`/api/admin/matches/${matchId}`)
			.set("Authorization", adminAuthorization)
			.send({ status });
	}

	describe("administrative access", () => {
		const protectedOperations: Array<[HttpMethod, string]> = [
			["GET", "/api/admin/matches"],
			["POST", "/api/admin/matches"],
			["GET", "/api/admin/matches/match-123"],
			["PUT", "/api/admin/matches/match-123"],
			["PATCH", "/api/admin/matches/match-123"],
			["DELETE", "/api/admin/matches/match-123"],
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

	describe("POST /api/admin/matches", () => {
		it("creates an OPEN match without players when the optional fields are omitted", async () => {
			const dateTime = MATCH_DATE_TIME();
			const response = await request(app)
				.post("/api/admin/matches")
				.set("Authorization", adminAuthorization)
				.send({ dateTime });

			expect(response.status).toBe(201);
			expect(response.body).toMatchObject({
				dateTime,
				status: "OPEN",
				place: null,
				players: [],
			});
			expect(response.body.id).toEqual(expect.any(String));
		});

		it("creates a match with the provided place and player confirmations", async () => {
			const first = await createPlayer();
			const second = await createPlayer();
			const dateTime = MATCH_DATE_TIME();
			const response = await request(app)
				.post("/api/admin/matches")
				.set("Authorization", adminAuthorization)
				.send({
					dateTime,
					place: "place-1",
					players: [
						{ id: first.id, slot: 1, confirmation: "CONFIRMED" },
						{ id: second.id, slot: 2 },
					],
				});

			expect(response.status).toBe(201);
			expect(response.body).toMatchObject({
				dateTime,
				place: "place-1",
				status: "OPEN",
				players: [
					{
						id: first.id,
						name: first.name,
						slot: 1,
						confirmation: "CONFIRMED",
					},
					{
						id: second.id,
						name: second.name,
						slot: 2,
						confirmation: "PENDING",
					},
				],
			});
		});

		it("starts as COMPLETED when all four provided players are confirmed", async () => {
			const players = await Promise.all(
				Array.from({ length: 4 }, () => createPlayer()),
			);
			const response = await request(app)
				.post("/api/admin/matches")
				.set("Authorization", adminAuthorization)
				.send({
					dateTime: MATCH_DATE_TIME(),
					players: players.map((player, index) => ({
						id: player.id,
						slot: index + 1,
						confirmation: "CONFIRMED",
					})),
				});

			expect(response.status).toBe(201);
			expect(response.body.status).toBe("COMPLETED");
			expect(response.body.players).toHaveLength(4);
			expect(
				response.body.players.every(
					(player: MatchResponse["players"][number]) =>
						player.confirmation === "CONFIRMED",
				),
			).toBe(true);
		});

		it("rejects a missing or invalid dateTime", async () => {
			const missing = await request(app)
				.post("/api/admin/matches")
				.set("Authorization", adminAuthorization)
				.send({});
			const invalid = await request(app)
				.post("/api/admin/matches")
				.set("Authorization", adminAuthorization)
				.send({ dateTime: "not-a-date" });

			for (const response of [missing, invalid]) {
				expect(response.status).toBe(400);
				expect(response.body).toMatchObject({
					code: "INVALID_REQUEST",
					message: expect.any(String),
				});
			}
		});

		it("rejects duplicate players, duplicate slots, more than four players, and unknown players", async () => {
			const player = await createPlayer();
			const anotherPlayer = await createPlayer();
			const requestBody = {
				dateTime: MATCH_DATE_TIME(),
				players: [
					{ id: player.id, slot: 1 },
					{ id: player.id, slot: 2 },
				],
			};
			const duplicate = await request(app)
				.post("/api/admin/matches")
				.set("Authorization", adminAuthorization)
				.send(requestBody);
			const duplicateSlot = await request(app)
				.post("/api/admin/matches")
				.set("Authorization", adminAuthorization)
				.send({
					dateTime: MATCH_DATE_TIME(),
					players: [
						{ id: player.id, slot: 1 },
						{ id: anotherPlayer.id, slot: 1 },
					],
				});
			const tooMany = await request(app)
				.post("/api/admin/matches")
				.set("Authorization", adminAuthorization)
				.send({
					dateTime: MATCH_DATE_TIME(),
					players: Array.from({ length: 5 }, (_, index) => ({
						id: `unknown-${index}`,
						slot: (index % 4) + 1,
					})),
				});
			const unknownPlayer = await request(app)
				.post("/api/admin/matches")
				.set("Authorization", adminAuthorization)
				.send({
					dateTime: MATCH_DATE_TIME(),
					players: [{ id: "unknown-player", slot: 1 }],
				});
			const invalidSlot = await request(app)
				.post("/api/admin/matches")
				.set("Authorization", adminAuthorization)
				.send({
					dateTime: MATCH_DATE_TIME(),
					players: [{ id: player.id, slot: 5 }],
				});
			const invalidConfirmation = await request(app)
				.post("/api/admin/matches")
				.set("Authorization", adminAuthorization)
				.send({
					dateTime: MATCH_DATE_TIME(),
					players: [{ id: player.id, slot: 1, confirmation: "WAITING" }],
				});

			expect(duplicate.status).toBe(409);
			expect(duplicate.body).toMatchObject({
				code: expect.any(String),
				message: expect.any(String),
			});
			expect(duplicateSlot.status).toBe(409);
			expect(duplicateSlot.body).toMatchObject({
				code: expect.any(String),
				message: expect.any(String),
			});
			expect(tooMany.status).toBe(400);
			expect(tooMany.body).toMatchObject({
				code: expect.any(String),
				message: expect.any(String),
			});
			expect(unknownPlayer.status).toBe(404);
			expect(unknownPlayer.body).toMatchObject({
				code: expect.any(String),
				message: expect.any(String),
			});
			for (const response of [invalidSlot, invalidConfirmation]) {
				expect(response.status).toBe(400);
				expect(response.body).toMatchObject({
					code: "INVALID_REQUEST",
					message: expect.any(String),
				});
			}
		});
	});

	describe("GET /api/admin/matches", () => {
		it("returns all matches in the documented items response", async () => {
			const first = await createAdminMatch();
			const second = await createAdminMatch();

			const response = await request(app)
				.get("/api/admin/matches")
				.set("Authorization", adminAuthorization);

			expect(response.status).toBe(200);
			expect(response.body.items).toEqual(
				expect.arrayContaining([
					expect.objectContaining({ id: first.id, status: "OPEN", players: [] }),
					expect.objectContaining({ id: second.id, status: "OPEN", players: [] }),
				]),
			);
		});

		it("filters matches by date-time interval, player, and status", async () => {
			const firstPlayer = await createPlayer();
			const secondPlayer = await createPlayer();
			const firstDateTime = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
			const secondDateTime = new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString();
			const first = await createAdminMatch({
				dateTime: firstDateTime,
				players: [{ id: firstPlayer.id, slot: 1 }],
			});
			const second = await createAdminMatch({
				dateTime: secondDateTime,
				players: [{ id: secondPlayer.id, slot: 1 }],
			});
			const completed = await createCompletedMatch();
			const byPlayer = await request(app)
				.get("/api/admin/matches")
				.set("Authorization", adminAuthorization)
				.query({ playerId: firstPlayer.id });
			const byStatus = await request(app)
				.get("/api/admin/matches")
				.set("Authorization", adminAuthorization)
				.query({ status: "COMPLETED" });
			const byDateRange = await request(app)
				.get("/api/admin/matches")
				.set("Authorization", adminAuthorization)
				.query({
					from: new Date(Date.parse(secondDateTime) - 30 * 60 * 1000).toISOString(),
					to: new Date(Date.parse(secondDateTime) + 30 * 60 * 1000).toISOString(),
				});

			expect(byPlayer.status).toBe(200);
			expect(byPlayer.body.items.map((match: { id: string }) => match.id)).toEqual([
				first.id,
			]);
			expect(byStatus.status).toBe(200);
			expect(byStatus.body.items.map((match: { id: string }) => match.id)).toEqual([
				completed.matchId,
			]);
			expect(byDateRange.status).toBe(200);
			expect(byDateRange.body.items.map((match: { id: string }) => match.id)).toEqual([
				second.id,
			]);
		});

		it("rejects a date-time interval whose to value is not later than from", async () => {
			const dateTime = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
			const response = await request(app)
				.get("/api/admin/matches")
				.set("Authorization", adminAuthorization)
				.query({ from: dateTime, to: dateTime });

			expect(response.status).toBe(400);
			expect(response.body).toMatchObject({
				code: expect.any(String),
				message: expect.any(String),
			});
		});

		it.each([
			["createdAt", "asc"],
			["createdAt", "desc"],
		] as const)("sorts matches by %s in %sending order", async (sortBy, sortOrder) => {
			const first = await createAdminMatch();
			await new Promise((resolve) => setTimeout(resolve, 10));
			const second = await createAdminMatch();
			const response = await request(app)
				.get("/api/admin/matches")
				.set("Authorization", adminAuthorization)
				.query({ sortBy, sortOrder });

			expect(response.status).toBe(200);
			expect(response.body.items.map((match: { id: string }) => match.id)).toEqual(
				sortOrder === "asc"
					? [first.id, second.id]
					: [second.id, first.id],
			);
		});

		it.each(["asc", "desc"] as const)(
			"sorts matches by updatedAt in %sending order",
			async (sortOrder) => {
				const first = await createAdminMatch();
				const second = await createAdminMatch();
				await new Promise((resolve) => setTimeout(resolve, 10));
				const firstUpdate = await request(app)
					.patch(`/api/admin/matches/${first.id}`)
					.set("Authorization", adminAuthorization)
					.send({ dateTime: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString() });
				await new Promise((resolve) => setTimeout(resolve, 10));
				const secondUpdate = await request(app)
					.patch(`/api/admin/matches/${second.id}`)
					.set("Authorization", adminAuthorization)
					.send({ dateTime: new Date(Date.now() + 49 * 60 * 60 * 1000).toISOString() });
				const response = await request(app)
					.get("/api/admin/matches")
					.set("Authorization", adminAuthorization)
					.query({ sortBy: "updatedAt", sortOrder });

				expect(firstUpdate.status).toBe(200);
				expect(secondUpdate.status).toBe(200);
				expect(response.status).toBe(200);
				expect(response.body.items.map((match: { id: string }) => match.id)).toEqual(
					sortOrder === "asc"
						? [first.id, second.id]
						: [second.id, first.id],
				);
			},
		);

		it("rejects unsupported status and sort parameters", async () => {
			const invalidStatus = await request(app)
				.get("/api/admin/matches")
				.set("Authorization", adminAuthorization)
				.query({ status: "INVALID" });
			const invalidSort = await request(app)
				.get("/api/admin/matches")
				.set("Authorization", adminAuthorization)
				.query({ sortBy: "dateTime" });

			for (const response of [invalidStatus, invalidSort]) {
				expect(response.status).toBe(400);
				expect(response.body).toMatchObject({
					code: expect.any(String),
					message: expect.any(String),
				});
			}
		});
	});

	describe("GET /api/admin/matches/{matchId}", () => {
		it("returns the requested match and reports an unknown match", async () => {
			const match = await createAdminMatch();
			const found = await request(app)
				.get(`/api/admin/matches/${match.id}`)
				.set("Authorization", adminAuthorization);
			const missing = await request(app)
				.get("/api/admin/matches/unknown-match")
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

	describe("PUT /api/admin/matches/{matchId}", () => {
		it("replaces the full match representation, including its players list", async () => {
			const originalPlayers = await Promise.all(
				Array.from({ length: 2 }, () => createPlayer()),
			);
			const match = await createAdminMatch({
				players: originalPlayers.map((player, index) => ({
					id: player.id,
					slot: index + 1,
				})),
			});
			const replacementPlayer = await createPlayer();
			const dateTime = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
			const response = await request(app)
				.put(`/api/admin/matches/${match.id}`)
				.set("Authorization", adminAuthorization)
				.send({
					dateTime,
					place: "place-2",
					status: "OPEN",
					players: [
						{
							id: replacementPlayer.id,
							slot: 3,
							confirmation: "PENDING",
						},
					],
				});

			expect(response.status).toBe(200);
			expect(response.body).toMatchObject({
				id: match.id,
				dateTime,
				place: "place-2",
				status: "OPEN",
				players: [
					{
						id: replacementPlayer.id,
						name: replacementPlayer.name,
						slot: 3,
						confirmation: "PENDING",
					},
				],
			});
		});

		it("requires the complete representation and rejects invalid player lists", async () => {
			const match = await createAdminMatch();
			const missingFields = await request(app)
				.put(`/api/admin/matches/${match.id}`)
				.set("Authorization", adminAuthorization)
				.send({ dateTime: MATCH_DATE_TIME() });
			const player = await createPlayer();
			const duplicatePlayers = await request(app)
				.put(`/api/admin/matches/${match.id}`)
				.set("Authorization", adminAuthorization)
				.send({
					dateTime: MATCH_DATE_TIME(),
					place: null,
					status: "OPEN",
					players: [
						{ id: player.id, slot: 1 },
						{ id: player.id, slot: 2 },
					],
				});
			const tooMany = await request(app)
				.put(`/api/admin/matches/${match.id}`)
				.set("Authorization", adminAuthorization)
				.send({
					dateTime: MATCH_DATE_TIME(),
					place: null,
					status: "OPEN",
					players: Array.from({ length: 5 }, (_, index) => ({
						id: `unknown-${index}`,
						slot: (index % 4) + 1,
					})),
				});

			expect(missingFields.status).toBe(400);
			expect(missingFields.body).toMatchObject({
				code: "INVALID_REQUEST",
				message: expect.any(String),
			});
			expect(duplicatePlayers.status).toBe(409);
			expect(duplicatePlayers.body).toMatchObject({
				code: expect.any(String),
				message: expect.any(String),
			});
			expect(tooMany.status).toBe(400);
			expect(tooMany.body).toMatchObject({
				code: "INVALID_REQUEST",
				message: expect.any(String),
			});
		});

		it("returns 404 for an unknown match or referenced player", async () => {
			const player = await createPlayer();
			const body = {
				dateTime: MATCH_DATE_TIME(),
				place: null,
				status: "OPEN",
				players: [{ id: player.id, slot: 1 }],
			};
			const missingMatch = await request(app)
				.put("/api/admin/matches/unknown-match")
				.set("Authorization", adminAuthorization)
				.send(body);
			const missingPlayer = await request(app)
				.put(`/api/admin/matches/${(await createAdminMatch()).id}`)
				.set("Authorization", adminAuthorization)
				.send({
					...body,
					players: [{ id: "unknown-player", slot: 1 }],
				});

			for (const response of [missingMatch, missingPlayer]) {
				expect(response.status).toBe(404);
				expect(response.body).toMatchObject({
					code: expect.any(String),
					message: expect.any(String),
				});
			}
		});

		it("rejects a transition to COMPLETED without exactly four players", async () => {
			const match = await createAdminMatch();
			const response = await request(app)
				.put(`/api/admin/matches/${match.id}`)
				.set("Authorization", adminAuthorization)
				.send({
					dateTime: match.dateTime,
					place: null,
					status: "COMPLETED",
					players: [],
				});

			expect(response.status).toBe(409);
			expect(response.body).toMatchObject({
				code: expect.any(String),
				message: expect.any(String),
			});
		});

		it("reopens the match and resets remaining confirmations when PUT removes a player", async () => {
			const { matchId, playerIds } = await createCompletedMatch();
			const confirmed = await changeMatchStatus(matchId, "CONFIRMED");
			expect(confirmed.status).toBe(200);
			const reopened = await changeMatchStatus(matchId, "COMPLETED");
			expect(reopened.status).toBe(200);

			const response = await request(app)
				.put(`/api/admin/matches/${matchId}`)
				.set("Authorization", adminAuthorization)
				.send({
					dateTime: reopened.body.dateTime,
					place: null,
					status: "OPEN",
					players: playerIds.slice(1).map((id, index) => ({
						id,
						slot: index + 2,
						confirmation: "CONFIRMED",
					})),
				});

			expect(response.status).toBe(200);
			expect(response.body.status).toBe("OPEN");
			expect(response.body.players).toHaveLength(3);
			expect(
				response.body.players.every(
					(player: MatchResponse["players"][number]) =>
						player.confirmation === "PENDING",
				),
			).toBe(true);
		});
	});

	describe("PATCH /api/admin/matches/{matchId}", () => {
		it("updates only supplied fields and preserves the other match data", async () => {
			const player = await createPlayer();
			const match = await createAdminMatch({
				place: "place-1",
				players: [{ id: player.id, slot: 1 }],
			});
			const dateTime = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
			const response = await request(app)
				.patch(`/api/admin/matches/${match.id}`)
				.set("Authorization", adminAuthorization)
				.send({ dateTime });

			expect(response.status).toBe(200);
			expect(response.body).toMatchObject({
				id: match.id,
				dateTime,
				place: "place-1",
				status: "OPEN",
				players: [
					{
						id: player.id,
						name: player.name,
						slot: 1,
					},
				],
			});
		});

		it("applies the documented status transitions, including reopening confirmed and cancelled matches", async () => {
			const { matchId } = await createCompletedMatch();
			const confirmed = await changeMatchStatus(matchId, "CONFIRMED");
			expect(confirmed.status).toBe(200);

			const reopenedConfirmed = await changeMatchStatus(matchId, "COMPLETED");
			expect(reopenedConfirmed.status).toBe(200);
			expect(reopenedConfirmed.body.status).toBe("COMPLETED");

			const cancelled = await changeMatchStatus(matchId, "CANCELLED");
			expect(cancelled.status).toBe(200);
			const reopenedCancelled = await changeMatchStatus(matchId, "COMPLETED");

			expect(reopenedCancelled.status).toBe(200);
			expect(reopenedCancelled.body.status).toBe("COMPLETED");
		});

		it("rejects an empty body, unsupported fields, invalid statuses, and invalid transitions", async () => {
			const match = await createAdminMatch();
			const empty = await request(app)
				.patch(`/api/admin/matches/${match.id}`)
				.set("Authorization", adminAuthorization)
				.send({});
			const unsupportedField = await request(app)
				.patch(`/api/admin/matches/${match.id}`)
				.set("Authorization", adminAuthorization)
				.send({ players: [] });
			const invalidStatus = await request(app)
				.patch(`/api/admin/matches/${match.id}`)
				.set("Authorization", adminAuthorization)
				.send({ status: "INVALID" });
			const invalidTransition = await changeMatchStatus(match.id, "CONFIRMED");

			for (const response of [empty, unsupportedField, invalidStatus]) {
				expect(response.status).toBe(400);
				expect(response.body).toMatchObject({
					code: "INVALID_REQUEST",
					message: expect.any(String),
				});
			}
			expect(invalidTransition.status).toBe(409);
			expect(invalidTransition.body).toMatchObject({
				code: expect.any(String),
				message: expect.any(String),
			});
		});

		it("requires exactly four players to transition to COMPLETED", async () => {
			const match = await createAdminMatch();
			const response = await changeMatchStatus(match.id, "COMPLETED");

			expect(response.status).toBe(409);
			expect(response.body).toMatchObject({
				code: expect.any(String),
				message: expect.any(String),
			});
		});

		it("returns 404 when the match does not exist", async () => {
			const response = await changeMatchStatus("unknown-match", "CANCELLED");

			expect(response.status).toBe(404);
			expect(response.body).toMatchObject({
				code: "MATCH_NOT_FOUND",
				message: expect.any(String),
			});
		});
	});

	describe("removed administrative match endpoints", () => {
		it("does not expose the separate player registration, removal, or status routes", async () => {
			const [player, anotherPlayer] = await Promise.all([
				createPlayer(),
				createPlayer(),
			]);
			const match = await createAdminMatch({
				players: [{ id: player.id, slot: 1 }],
			});

			const requests = [
				request(app)
					.post(`/api/admin/matches/${match.id}/players`)
					.set("Authorization", adminAuthorization)
					.send({ playerId: anotherPlayer.id }),
				request(app)
					.delete(`/api/admin/matches/${match.id}/players/${player.id}`)
					.set("Authorization", adminAuthorization),
				request(app)
					.patch(`/api/admin/matches/${match.id}/status`)
					.set("Authorization", adminAuthorization)
					.send({ status: "CANCELLED" }),
			];
			const responses = await Promise.all(requests);

			expect(responses.map(({ status }) => status)).toEqual([404, 404, 404]);
		});
	});

	describe("DELETE /api/admin/matches/{matchId}", () => {
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
					.delete(`/api/admin/matches/${matchId}`)
					.set("Authorization", adminAuthorization);
				const missing = await request(app)
					.delete(`/api/admin/matches/${matchId}`)
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
