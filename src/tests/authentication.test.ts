import request from "supertest";
import { jwtVerify } from "jose";
import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { createApp } from "../app";
import { Application } from "express";

function expectRefreshCookie(
	cookie: string | undefined,
	expiresAt: string,
): string {
	expect(cookie).toBeDefined();
	if (!cookie) {
		throw new Error("Expected a refresh token cookie.");
	}

	expect(cookie).toMatch(/^refreshToken=[^;]+;/);
	expect(cookie).toMatch(/;\s*HttpOnly/i);
	expect(cookie).toMatch(/;\s*Secure/i);
	expect(cookie).toMatch(/;\s*SameSite=Strict/i);
	expect(cookie).toMatch(/;\s*Path=\/api\/auth/i);

	const cookieExpiresAt = cookie.match(/;\s*Expires=([^;]+)/i)?.[1];
	expect(cookieExpiresAt).toBeDefined();
	if (!cookieExpiresAt) {
		throw new Error("Expected the refresh cookie to have an expiry.");
	}
	expect(Math.floor(new Date(cookieExpiresAt).getTime() / 1000)).toBe(
		Math.floor(new Date(expiresAt).getTime() / 1000),
	);

	return cookie.split(";")[0];
}

describe("Authentication", () => {
	let app: Application;

	beforeEach(() => {
		app = createApp();
	});

	afterEach(() => {
		vi.unstubAllEnvs();
	});
		
	describe("POST /api/auth/login", () => {
		it("returns an access token and sets the refresh token in a secure cookie", async () => {
			const jwtSecret = "test-secret-that-is-at-least-32-bytes-long";
			vi.stubEnv("JWT_SECRET", jwtSecret);
			const loginApp = createApp();

			const response = await request(loginApp)
				.post("/api/auth/login")
				.send({ email: "player@example.com", password: "correct-password" });

			expect(response.status).toBe(200);
			expect(response.body).toMatchObject({
				tokenType: "Bearer",
				expiresIn: Number(process.env.ACCESS_TOKEN_EXPIRES_IN),
				accessToken: expect.any(String),
				refreshTokenExpiresAt: expect.any(String),
			});
			expect(response.body).not.toHaveProperty("refreshToken");

			expectRefreshCookie(
				response.headers["set-cookie"]?.[0],
				response.body.refreshTokenExpiresAt,
			);

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
			const response = await request(app).post("/api/auth/login").send({});

			expect(response.status).toBe(400);
			expect(response.body).toMatchObject({
				code: "INVALID_REQUEST",
				message: expect.any(String),
			});
		});

		it("rejects invalid credentials with a generic authentication error", async () => {
			const response = await request(app)
				.post("/api/auth/login")
				.send({ email: "unknown@example.com", password: "invalid-password" });

			expect(response.status).toBe(401);
			expect(response.body).toMatchObject({
				code: "AUTHENTICATION_FAILED",
				message: "Authentication failed.",
			});
		});
	});

	describe("POST /api/auth/password", () => {
		it("requires an authenticated user", async () => {
			const response = await request(app).post("/api/auth/password").send({
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
				.post("/api/auth/password")
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

	describe("POST /api/auth/refresh", () => {
		it("rejects a request without a refresh token", async () => {
			const response = await request(app).post("/api/auth/refresh").send({});

			expect(response.status).toBe(401);
			expect(response.body).toMatchObject({
				code: "AUTHENTICATION_FAILED",
				message: "Authentication failed.",
			});
		});

		it("rejects an invalid refresh token", async () => {
			const response = await request(app)
				.post("/api/auth/refresh")
				.set("Cookie", "refreshToken=invalid-refresh-token");

			expect(response.status).toBe(401);
			expect(response.body).toMatchObject({
				code: "AUTHENTICATION_FAILED",
				message: "Authentication failed.",
			});
		});

		it("rotates the refresh cookie without exposing its value in JSON", async () => {
			vi.stubEnv(
				"JWT_SECRET",
				"test-secret-that-is-at-least-32-bytes-long",
			);
			const refreshApp = createApp();
			const loginResponse = await request(refreshApp)
				.post("/api/auth/login")
				.send({
					email: "player@example.com",
					password: "correct-password",
				});
			const originalCookie = expectRefreshCookie(
				loginResponse.headers["set-cookie"]?.[0],
				loginResponse.body.refreshTokenExpiresAt,
			);

			const response = await request(refreshApp)
				.post("/api/auth/refresh")
				.set("Cookie", originalCookie);

			expect(response.status).toBe(200);
			expect(response.body).toMatchObject({
				tokenType: "Bearer",
				expiresIn: Number(process.env.ACCESS_TOKEN_EXPIRES_IN),
				accessToken: expect.any(String),
				refreshTokenExpiresAt: expect.any(String),
			});
			expect(response.body).not.toHaveProperty("refreshToken");

			const rotatedCookie = expectRefreshCookie(
				response.headers["set-cookie"]?.[0],
				response.body.refreshTokenExpiresAt,
			);
			expect(rotatedCookie).not.toBe(originalCookie);

			const reusedTokenResponse = await request(refreshApp)
				.post("/api/auth/refresh")
				.set("Cookie", originalCookie);
			expect(reusedTokenResponse.status).toBe(401);
			expect(reusedTokenResponse.body).toMatchObject({
				code: "AUTHENTICATION_FAILED",
				message: "Authentication failed.",
			});
		});

		it("does not accept a refresh token in the JSON body", async () => {
			vi.stubEnv(
				"JWT_SECRET",
				"test-secret-that-is-at-least-32-bytes-long",
			);
			const refreshApp = createApp();
			const loginResponse = await request(refreshApp)
				.post("/api/auth/login")
				.send({
					email: "player@example.com",
					password: "correct-password",
				});
			const originalCookie = expectRefreshCookie(
				loginResponse.headers["set-cookie"]?.[0],
				loginResponse.body.refreshTokenExpiresAt,
			);
			const refreshToken = originalCookie.slice("refreshToken=".length);

			const response = await request(refreshApp)
				.post("/api/auth/refresh")
				.send({ refreshToken });

			expect(response.status).toBe(401);
			expect(response.body).toMatchObject({
				code: "AUTHENTICATION_FAILED",
				message: "Authentication failed.",
			});
		});
	});
});
