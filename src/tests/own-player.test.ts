import { Application } from "express";
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
		vi.unstubAllEnvs();
	});

	async function getAccessToken(): Promise<string> {
		const response = await request(app).post("/auth/login").send({
			email: "player-1@example.com",
			password: "correct-password",
		});

		expect(response.status).toBe(200);
		return response.body.accessToken as string;
	}

	describe("GET /players/me", () => {
		it("rejects a request without an access token", async () => {
			const response = await request(app).get("/players/me");

			expect(response.status).toBe(401);
			expect(response.body).toMatchObject({
				code: "AUTHENTICATION_FAILED",
				message: expect.any(String),
			});
		});

		it("rejects a request with an invalid access token", async () => {
			const response = await request(app)
				.get("/players/me")
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
				.get("/players/me")
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

	describe("PATCH /players/me", () => {
		it("rejects a request without an access token", async () => {
			const response = await request(app).patch("/players/me").send({
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
				.patch("/players/me")
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
				.patch("/players/me")
				.set("Authorization", authorization)
				.send(update);

			expect(response.status).toBe(200);
			expect(response.body).toMatchObject({
				id: "test-player",
				...update,
				active: true,
				isAdmin: false,
			});
			expect(response.body).not.toHaveProperty("passwordHash");

			const profile = await request(app)
				.get("/players/me")
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
				.patch("/players/me")
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
				.patch("/players/me")
				.set("Authorization", `Bearer ${accessToken}`)
				.send({});

			expect(response.status).toBe(400);
			expect(response.body).toMatchObject({
				code: "INVALID_REQUEST",
				message: expect.any(String),
			});
		});
	});
});
