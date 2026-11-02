import { Application } from "express";
import { SignJWT } from "jose";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../app";

const JWT_SECRET = "own-player-test-secret-with-at-least-32-bytes";

describe("Own player API", () => {
	let app: Application;

	beforeEach(() => {
		vi.stubEnv("JWT_SECRET", JWT_SECRET);
		app = createApp();
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.unstubAllEnvs();
	});

	async function getAccessToken(): Promise<string> {
		const response = await request(app).post("/api/auth/login").send({
			email: "player@example.com",
			password: "correct-password",
		});

		expect(response.status).toBe(200);
		return response.body.accessToken as string;
	}

	async function getAccessTokenFor(playerId: string): Promise<string> {
		return new SignJWT({})
			.setProtectedHeader({ alg: "HS256" })
			.setSubject(playerId)
			.setIssuer("satispadel-api")
			.setAudience("satispadel-client")
			.setIssuedAt()
			.setExpirationTime("15m")
			.sign(Buffer.from(JWT_SECRET, "utf8"));
	}

	describe("GET /api/players/me", () => {
		it("rejects a request without an access token", async () => {
			const response = await request(app).get("/api/players/me");

			expect(response.status).toBe(401);
			expect(response.body).toMatchObject({
				code: "AUTHENTICATION_FAILED",
				message: expect.any(String),
			});
		});

		it("rejects a request with an invalid access token", async () => {
			const response = await request(app)
				.get("/api/players/me")
				.set("Authorization", "Bearer invalid-token");

			expect(response.status).toBe(401);
			expect(response.body).toMatchObject({
				code: "AUTHENTICATION_FAILED",
				message: expect.any(String),
			});
		});

		it("returns the authenticated player's information without credentials", async () => {
			const accessToken = await getAccessToken();
			const response = await request(app)
				.get("/api/players/me")
				.set("Authorization", `Bearer ${accessToken}`);

			expect(response.status).toBe(200);
			expect(response.body).toMatchObject({
				id: "test-player",
				name: "Test Player",
				email: "player@example.com",
				phone: "+34600111222",
				createdAt: expect.any(String),
			});
			expect(response.body).toHaveProperty("phone");
			expect(response.body).toHaveProperty("createdAt");
			expect(response.body).toHaveProperty("updatedAt");
			expect(response.body).toHaveProperty("id");
			expect(response.body).not.toHaveProperty("password");
			expect(response.body).not.toHaveProperty("passwordHash");
		});
	});

	describe("PATCH /api/players/me", () => {
		it("rejects a request without an access token", async () => {
			const response = await request(app).patch("/api/players/me").send({
				name: "Updated Player",
			});

			expect(response.status).toBe(401);
			expect(response.body).toMatchObject({
				code: "AUTHENTICATION_FAILED",
				message: expect.any(String),
			});
		});

		it("rejects a request with an invalid access token", async () => {
			const response = await request(app)
				.patch("/api/players/me")
				.set("Authorization", "Bearer invalid-token")
				.send({ name: "Updated Player" });

			expect(response.status).toBe(401);
			expect(response.body).toMatchObject({
				code: "AUTHENTICATION_FAILED",
				message: expect.any(String),
			});
		});

		it("updates only the authenticated player's editable information", async () => {
			const accessToken = await getAccessToken();
			const authorization = `Bearer ${accessToken}`;
			const update = {
				name: "Updated Player",
				email: "updated@example.com",
				phone: "+34600111222",
			};

			const response = await request(app)
				.patch("/api/players/me")
				.set("Authorization", authorization)
				.send(update);

			expect(response.status).toBe(200);
			expect(response.body).toMatchObject({
				id: "test-player",
				name: "Updated Player",
				email: "updated@example.com",
				phone: "+34600111222",
			});
			expect(response.body).not.toHaveProperty("passwordHash");

			const profile = await request(app)
				.get("/api/players/me")
				.set("Authorization", authorization);
			expect(profile.status).toBe(200);
			expect(profile.body).toMatchObject(update);
		});

		it.each([
			["active", { active: false }],
			["isAdmin", { isAdmin: true }],
		])("rejects attempts to update %s", async (_field, protectedField) => {
			const accessToken = await getAccessToken();
			const response = await request(app)
				.patch("/api/players/me")
				.set("Authorization", `Bearer ${accessToken}`)
				.send({ name: "Updated Player", ...protectedField });

			expect(response.status).toBe(400);
			expect(response.body).toMatchObject({
				code: "INVALID_REQUEST",
				message: expect.any(String),
			});
		});

		it("rejects an empty update", async () => {
			const accessToken = await getAccessToken();
			const response = await request(app)
				.patch("/api/players/me")
				.set("Authorization", `Bearer ${accessToken}`)
				.send({});

			expect(response.status).toBe(400);
			expect(response.body).toMatchObject({
				code: "INVALID_REQUEST",
				message: expect.any(String),
			});
		});

	});

	describe("GET /api/players/matches", () => {
			it("rejects a request without an access token", async () => {
				const response = await request(app).get("/api/players/matches");

				expect(response.status).toBe(401);
				expect(response.body).toMatchObject({
					code: "AUTHENTICATION_FAILED",
					message: expect.any(String),
				});
			});

			it("rejects a request with an invalid access token", async () => {
				const response = await request(app)
					.get("/api/players/matches")
					.set("Authorization", "******");

				expect(response.status).toBe(401);
				expect(response.body).toMatchObject({
					code: "AUTHENTICATION_FAILED",
					message: expect.any(String),
				});
			});

			it("returns only future matches registered to the authenticated player", async () => {
				const accessToken = await getAccessToken();
				const anotherAccessToken = await getAccessTokenFor("another-player");
				const ownMatchDateTime = new Date(Date.now() + 60 * 60 * 1000).toISOString();
				const anotherMatchDateTime = new Date(
					Date.now() + 2 * 60 * 60 * 1000,
				).toISOString();
				const ownMatch = await request(app)
					.post("/api/matches")
					.set("Authorization", `Bearer ${accessToken}`)
					.send({ dateTime: ownMatchDateTime });
				const anotherPlayersMatch = await request(app)
					.post("/api/matches")
					.set("Authorization", `Bearer ${anotherAccessToken}`)
					.send({ dateTime: anotherMatchDateTime });

				expect(ownMatch.status).toBe(201);
				expect(anotherPlayersMatch.status).toBe(201);

				const response = await request(app)
					.get("/api/players/matches")
					.set("Authorization", `Bearer ${accessToken}`);

				expect(response.status).toBe(200);
				expect(response.body.items).toHaveLength(1);
				expect(response.body.items[0]).toMatchObject({
					id: ownMatch.body.id,
					dateTime: ownMatchDateTime,
					status: "OPEN",
					players: [
						{
							id: "test-player",
							slot: 1,
						},
					],
				});
				expect(
					new Date(response.body.items[0].dateTime).getTime(),
				).toBeGreaterThan(Date.now());
			});

			it("does not return a match after its dateTime has passed", async () => {
				const accessToken = await getAccessToken();
				const now = Date.now();
				vi.useFakeTimers({ toFake: ["Date"] });
				vi.setSystemTime(now);
				const dateTime = new Date(now + 60 * 60 * 1000).toISOString();

				const created = await request(app)
					.post("/api/matches")
					.set("Authorization", `Bearer ${accessToken}`)
					.send({ dateTime });

				expect(created.status).toBe(201);
				vi.setSystemTime(new Date(dateTime).getTime() + 1);
				const freshAccessToken = await getAccessToken();

				const response = await request(app)
					.get("/api/players/matches")
					.set("Authorization", `Bearer ${freshAccessToken}`);

				expect(response.status).toBe(200);
				expect(response.body.items).toEqual([]);
		});
	});
});
