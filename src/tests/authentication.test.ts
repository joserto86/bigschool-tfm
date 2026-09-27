import request from "supertest";
import { jwtVerify } from "jose";
import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { createApp } from "../app";
import { Application } from "express";

describe("Authentication", () => {
	let app: Application;

	beforeEach(() => {
		app = createApp();
	});

	afterEach(() => {
		vi.unstubAllEnvs();
	});
		
	describe("POST /auth/login", () => {
		it("returns an access token and refresh token for valid credentials", async () => {
			const jwtSecret = "test-secret-that-is-at-least-32-bytes-long";
			vi.stubEnv("JWT_SECRET", jwtSecret);
			const loginApp = createApp();

			const response = await request(loginApp)
				.post("/auth/login")
				.send({ email: "player@example.com", password: "correct-password" });

			expect(response.status).toBe(200);
			expect(response.body).toMatchObject({
				tokenType: "Bearer",
				expiresIn: 900,
				accessToken: expect.any(String),
				refreshToken: expect.any(String),
				refreshTokenExpiresAt: expect.any(String),
			});

			const { payload } = await jwtVerify(
				response.body.accessToken,
				new TextEncoder().encode(jwtSecret),
				{
					issuer: "satispadel-api",
					audience: "satispadel-client",
					algorithms: ["HS256"],
				},
			);
			expect(payload.sub).toBe("test-player");
		});

		it("rejects a request without email and password", async () => {
			const response = await request(app).post("/auth/login").send({});

			expect(response.status).toBe(400);
			expect(response.body).toMatchObject({
				code: "INVALID_REQUEST",
				message: expect.any(String),
			});
		});

		it("rejects invalid credentials with a generic authentication error", async () => {
			const response = await request(app)
				.post("/auth/login")
				.send({ email: "unknown@example.com", password: "invalid-password" });

			expect(response.status).toBe(401);
			expect(response.body).toMatchObject({
				code: "AUTHENTICATION_FAILED",
				message: "Authentication failed.",
			});
		});
	});

	describe("POST /auth/password", () => {
		it("requires an authenticated user", async () => {
			const response = await request(app).post("/auth/password").send({
				currentPassword: "current-password",
				newPassword: "new-password",
			});

			expect(response.status).toBe(401);
			expect(response.body).toMatchObject({
				code: "AUTHENTICATION_FAILED",
				message: "Authentication failed.",
			});
		});

		it("rejects an invalid access token", async () => {
			const response = await request(app)
				.post("/auth/password")
				.set("Authorization", "Bearer invalid-access-token")
				.send({
					currentPassword: "current-password",
					newPassword: "new-password",
				});

			expect(response.status).toBe(401);
			expect(response.body).toMatchObject({
				code: "AUTHENTICATION_FAILED",
				message: "Authentication failed.",
			});
		});
	});

	describe("POST /auth/refresh", () => {
		it("rejects a request without a refresh token", async () => {
			const response = await request(app).post("/auth/refresh").send({});

			expect(response.status).toBe(401);
			expect(response.body).toMatchObject({
				code: "AUTHENTICATION_FAILED",
				message: "Authentication failed.",
			});
		});

		it("rejects an invalid refresh token", async () => {
			const response = await request(app)
				.post("/auth/refresh")
				.send({ refreshToken: "invalid-refresh-token" });

			expect(response.status).toBe(401);
			expect(response.body).toMatchObject({
				code: "AUTHENTICATION_FAILED",
				message: "Authentication failed.",
			});
		});
	});
});
