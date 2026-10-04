import request from "supertest";
import { Application } from "express";
import { SignJWT } from "jose";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../app";

const JWT_SECRET = "matches-test-secret-with-at-least-32-bytes";

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

describe("Matches API", () => {
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

	describe("POST /matches", () => {
		it("rejects a request without a valid access token", async () => {
			const missing = await request(app)
				.post("/matches")
				.send({ dateTime: "2026-10-10T18:00:00+02:00" });
			const invalid = await request(app)
				.post("/matches")
				.set("Authorization", "Bearer invalid-token")
				.send({ dateTime: "2026-10-10T18:00:00+02:00" });

			expect(missing.status).toBe(401);
			expect(invalid.status).toBe(401);
			expect(missing.body.code).toBe("AUTHENTICATION_FAILED");
		});

		it("creates a match in OPEN status with no players", async () => {
			const response = await request(app)
				.post("/matches")
				.set("Authorization", authorization)
				.send({ dateTime: "2026-10-10T18:00:00+02:00" });

			expect(response.status).toBe(201);
			expect(response.body).toMatchObject({
				dateTime: "2026-10-10T18:00:00+02:00",
				status: "OPEN",
				players: [],
			});
			expect(response.body.id).toBeTruthy();
		});

		it("allows creating multiple matches with the same dateTime", async () => {
			const payload = { dateTime: "2026-11-01T10:00:00+01:00" };

			const first = await request(app).post("/matches")
				.set("Authorization", authorization).send(payload);
			const second = await request(app).post("/matches")
				.set("Authorization", authorization).send(payload);

			expect(first.status).toBe(201);
			expect(second.status).toBe(201);
			expect(first.body.id).not.toBe(second.body.id);
		});

		it("rejects a request without dateTime", async () => {
			const response = await request(app).post("/matches")
				.set("Authorization", authorization).send({});

			expect(response.status).toBe(400);
			expect(response.body).toHaveProperty("code");
			expect(response.body).toHaveProperty("message");
		});
	});

	describe("GET /matches", () => {
		it("returns matches filtered by dateTime", async () => {
			const dateTime = "2026-12-01T09:00:00+01:00";
			await request(app).post("/matches")
				.set("Authorization", authorization).send({ dateTime });

			const response = await request(app)
				.get("/matches")
				.set("Authorization", authorization)
				.query({ dateTime });

			expect(response.status).toBe(200);
			expect(response.body.items.length).toBeGreaterThanOrEqual(1);
			for (const match of response.body.items) {
				expect(match.dateTime).toBe(dateTime);
			}
		});

		it("returns an empty list when no match matches the dateTime", async () => {
			const response = await request(app)
				.get("/matches")
				.set("Authorization", authorization)
				.query({ dateTime: "2030-01-01T00:00:00+01:00" });

			expect(response.status).toBe(200);
			expect(response.body.items).toEqual([]);
		});

		it("requires the dateTime query parameter", async () => {
			const response = await request(app).get("/matches")
				.set("Authorization", authorization);

			expect(response.status).toBe(400);
		});
	});

	describe("GET /matches/{matchId}", () => {
		it("returns the match when it exists", async () => {
			const created = await request(app)
				.post("/matches")
				.set("Authorization", authorization)
				.send({ dateTime: "2026-10-15T20:00:00+02:00" });

			const response = await request(app).get(`/matches/${created.body.id}`)
				.set("Authorization", authorization);

			expect(response.status).toBe(200);
			expect(response.body.id).toBe(created.body.id);
		});

		it("returns 404 when the match does not exist", async () => {
			const response = await request(app).get("/matches/does-not-exist")
				.set("Authorization", authorization);

			expect(response.status).toBe(404);
			expect(response.body.code).toBe("MATCH_NOT_FOUND");
		});
	});
});