import request from "supertest";
import { Application } from "express";
import { SignJWT } from "jose";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../app";

const JWT_SECRET = "matches-test-secret-with-at-least-32-bytes";

async function createAccessToken(playerId = "test-player"): Promise<string> {
	return new SignJWT({})
		.setProtectedHeader({ alg: "HS256" })
		.setSubject(playerId)
		.setIssuer("satispadel-api")
		.setAudience("satispadel-client")
		.setIssuedAt()
		.setExpirationTime("15m")
		.sign(Buffer.from(JWT_SECRET, "utf8"));
}

async function createAuthorization(playerId = "test-player"): Promise<string> {
	return `Bearer ${await createAccessToken(playerId)}`;
}

describe("Matches API", () => {
	let app: Application;
	let authorization: string;

	beforeEach(async () => {
		vi.stubEnv("JWT_SECRET", JWT_SECRET);
		app = createApp();
		authorization = await createAuthorization();
	});

	afterEach(() => {
		vi.unstubAllEnvs();
	});

	describe("POST /api/matches", () => {
		it("rejects a request without a valid access token", async () => {
			const missing = await request(app)
				.post("/api/matches")
				.send({ dateTime: new Date(Date.now() + 3600 * 1000).toISOString() });
			const invalid = await request(app)
				.post("/api/matches")
				.set("Authorization", "Bearer invalid-token")
				.send({ dateTime: new Date(Date.now() + 3600 * 1000).toISOString() });

			expect(missing.status).toBe(401);
			expect(invalid.status).toBe(401);
			expect(missing.body.code).toBe("AUTHENTICATION_FAILED");
		});

		it("creates a match in OPEN status with the authenticated player registered", async () => {
			const dateTime = new Date(Date.now() + 3600 * 1000).toISOString();

			const response = await request(app)
				.post("/api/matches")
				.set("Authorization", authorization)
				.send({ dateTime });

			expect(response.status).toBe(201);
			expect(
				response.body.place === null || typeof response.body.place === "string",
			).toBe(true);
			expect(response.body).toMatchObject({
				dateTime: dateTime,
				status: "OPEN",
				players: [
					{
						id: "test-player",
						name: expect.any(String),
						slot: 1,
						confirmation: null,
					},
				],
			});
			expect(response.body.id).toBeTruthy();
		});

		it("rejects a request with a past dateTime", async () => {
			const response = await request(app)
				.post("/api/matches")
				.set("Authorization", authorization)
				.send({ dateTime: new Date(Date.now() - 3600 * 1000).toISOString() });

			expect(response.status).toBe(400);
			expect(response.body.code).toBe("INVALID_REQUEST");
		});

		it("allows creating multiple matches with the same dateTime", async () => {
			const payload = { dateTime: new Date(Date.now() + 3600 * 1000).toISOString() };

			const first = await request(app).post("/api/matches")
				.set("Authorization", await createAuthorization("player-1")).send(payload);
			const second = await request(app).post("/api/matches")
				.set("Authorization", await createAuthorization("player-2")).send(payload);

			expect(first.status).toBe(201);
			expect(second.status).toBe(201);
			expect(first.body.id).not.toBe(second.body.id);
		});

		it("rejects creating another match at the same dateTime for the authenticated player", async () => {
			const payload = { dateTime: new Date(Date.now() + 3600 * 1000).toISOString() };

			const first = await request(app).post("/api/matches")
				.set("Authorization", authorization).send(payload);
			const second = await request(app).post("/api/matches")
				.set("Authorization", authorization).send(payload);

			expect(first.status).toBe(201);
			expect(second.status).toBe(409);
			expect(second.body).toMatchObject({
				code: expect.any(String),
				message: expect.any(String),
			});
		});

		it("rejects a request without dateTime", async () => {
			const response = await request(app).post("/api/matches")
				.set("Authorization", authorization).send({});

			expect(response.status).toBe(400);
			expect(response.body).toHaveProperty("code");
			expect(response.body).toHaveProperty("message");
		});
	});

	describe("GET /api/matches", () => {
		it("lists all matches without requiring date filters", async () => {
			const dateTime = new Date(Date.now() + 3600 * 1000).toISOString();
			const created = await request(app)
				.post("/api/matches")
				.set("Authorization", authorization)
				.send({ dateTime });
			const response = await request(app)
				.get("/api/matches")
				.set("Authorization", authorization);

			expect(created.status).toBe(201);
			expect(response.status).toBe(200);
			expect(response.body.items).toEqual(
				expect.arrayContaining([
					expect.objectContaining({ id: created.body.id, dateTime }),
				]),
			);
		});

		it("filters matches by a from/to date-time interval", async () => {
			const from = new Date(Date.now() + 3600 * 1000).toISOString();
			const includedDateTime = new Date(Date.now() + 2 * 3600 * 1000).toISOString();
			const to = new Date(Date.now() + 3 * 3600 * 1000).toISOString();
			const before = await request(app)
				.post("/api/matches")
				.set("Authorization", authorization)
				.send({ dateTime: from });
			const included = await request(app)
				.post("/api/matches")
				.set("Authorization", authorization)
				.send({ dateTime: includedDateTime });
			const after = await request(app)
				.post("/api/matches")
				.set("Authorization", authorization)
				.send({ dateTime: to });
			const response = await request(app)
				.get("/api/matches")
				.set("Authorization", authorization)
				.query({
					from: new Date(Date.parse(from) + 30 * 60 * 1000).toISOString(),
					to: new Date(Date.parse(to) - 30 * 60 * 1000).toISOString(),
				});

			expect([before.status, included.status, after.status]).toEqual([
				201, 201, 201,
			]);
			expect(response.status).toBe(200);
			expect(response.body.items).toEqual([
				expect.objectContaining({
					id: included.body.id,
					dateTime: includedDateTime,
				}),
			]);
		});

		it("rejects a date-time interval whose to value is not later than from", async () => {
			const dateTime = new Date(Date.now() + 3600 * 1000).toISOString();
			const response = await request(app)
				.get("/api/matches")
				.set("Authorization", authorization)
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
			const first = await request(app)
				.post("/api/matches")
				.set("Authorization", authorization)
				.send({ dateTime: new Date(Date.now() + 3600 * 1000).toISOString() });
			await new Promise((resolve) => setTimeout(resolve, 10));
			const second = await request(app)
				.post("/api/matches")
				.set("Authorization", authorization)
				.send({ dateTime: new Date(Date.now() + 2 * 3600 * 1000).toISOString() });
			const response = await request(app)
				.get("/api/matches")
				.set("Authorization", authorization)
				.query({ sortBy, sortOrder });

			expect(first.status).toBe(201);
			expect(second.status).toBe(201);
			expect(response.status).toBe(200);
			expect(response.body.items.map((match: { id: string }) => match.id)).toEqual(
				sortOrder === "asc"
					? [first.body.id, second.body.id]
					: [second.body.id, first.body.id],
			);
		});

		it.each(["asc", "desc"] as const)(
			"sorts matches by updatedAt in %sending order",
			async (sortOrder) => {
				const first = await request(app)
					.post("/api/matches")
					.set("Authorization", authorization)
					.send({ dateTime: new Date(Date.now() + 3600 * 1000).toISOString() });
				const second = await request(app)
					.post("/api/matches")
					.set("Authorization", authorization)
					.send({ dateTime: new Date(Date.now() + 2 * 3600 * 1000).toISOString() });
				await new Promise((resolve) => setTimeout(resolve, 10));
				const firstJoin = await request(app)
					.post(`/api/matches/${first.body.id}/players`)
					.set("Authorization", await createAuthorization("first-joiner"));
				await new Promise((resolve) => setTimeout(resolve, 10));
				const secondJoin = await request(app)
					.post(`/api/matches/${second.body.id}/players`)
					.set("Authorization", await createAuthorization("second-joiner"));
				const response = await request(app)
					.get("/api/matches")
					.set("Authorization", authorization)
					.query({ sortBy: "updatedAt", sortOrder });

				expect(firstJoin.status).toBe(201);
				expect(secondJoin.status).toBe(201);
				expect(response.status).toBe(200);
				expect(response.body.items.map((match: { id: string }) => match.id)).toEqual(
					sortOrder === "asc"
						? [first.body.id, second.body.id]
						: [second.body.id, first.body.id],
				);
			},
		);

		it("rejects sort fields that are not supported", async () => {
			const response = await request(app)
				.get("/api/matches")
				.set("Authorization", authorization)
				.query({ sortBy: "dateTime" });

			expect(response.status).toBe(400);
			expect(response.body).toMatchObject({
				code: expect.any(String),
				message: expect.any(String),
			});
		});
	});

	describe("GET /api/matches/{matchId}", () => {
		it("returns the match when it exists", async () => {
			const created = await request(app)
				.post("/api/matches")
				.set("Authorization", authorization)
				.send({ dateTime: new Date(Date.now() + 3600 * 1000).toISOString() });

			const response = await request(app).get(`/api/matches/${created.body.id}`)
				.set("Authorization", authorization);

			expect(response.status).toBe(200);
			expect(
				response.body.place === null || typeof response.body.place === "string",
			).toBe(true);
			expect(response.body).toMatchObject({
				id: created.body.id,
				players: [
					{
						id: "test-player",
						name: expect.any(String),
						slot: 1,
						confirmation: null,
					},
				],
			});
		});

		it("returns 404 when the match does not exist", async () => {
			const response = await request(app).get("/api/matches/does-not-exist")
				.set("Authorization", authorization);

			expect(response.status).toBe(404);
			expect(response.body.code).toBe("MATCH_NOT_FOUND");
		});
	});

	describe("POST /api/matches/{matchId}/players", () => {
		it("rejects registering a player in another match at the same dateTime", async () => {
			const dateTime = new Date(Date.now() + 3600 * 1000).toISOString();
			const firstMatch = await request(app)
				.post("/api/matches")
				.set("Authorization", await createAuthorization("player-1"))
				.send({ dateTime });
			const joinFirstMatch = await request(app)
				.post(`/api/matches/${firstMatch.body.id}/players`)
				.set("Authorization", await createAuthorization("player-2"));
			const secondMatch = await request(app)
				.post("/api/matches")
				.set("Authorization", await createAuthorization("player-3"))
				.send({ dateTime });

			const joinSecondMatch = await request(app)
				.post(`/api/matches/${secondMatch.body.id}/players`)
				.set("Authorization", await createAuthorization("player-2"));

			expect(firstMatch.status).toBe(201);
			expect(joinFirstMatch.status).toBe(201);
			expect(secondMatch.status).toBe(201);
			expect(joinSecondMatch.status).toBe(409);
			expect(joinSecondMatch.body).toMatchObject({
				code: expect.any(String),
				message: expect.any(String),
			});
		});
	});
});