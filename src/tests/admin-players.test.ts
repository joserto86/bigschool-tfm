import request from "supertest";
import { Application } from "express";
import { SignJWT } from "jose";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../app";
import { password } from "@inquirer/prompts";

const JWT_SECRET = "admin-players-test-secret-with-32-bytes";
const ADMIN_ID = "test-admin";
const PLAYER_ID = "player-to-manage";

async function createAccessToken(isAdmin: boolean): Promise<string> {
	return new SignJWT({ isAdmin })
		.setProtectedHeader({ alg: "HS256" })
		.setSubject(ADMIN_ID)
		.setIssuer("satispadel-api")
		.setAudience("satispadel-client")
		.setIssuedAt()
		.setExpirationTime("15m")
		.sign(Buffer.from(JWT_SECRET, "utf8"));
}

describe("Admin Players API", () => {
	let app: Application;
	let adminAuthorization: string;

	beforeEach(async () => {
		vi.stubEnv("JWT_SECRET", JWT_SECRET);
		app = createApp();
		adminAuthorization = `Bearer ${await createAccessToken(true)}`;
	});

	afterEach(() => {
		vi.unstubAllEnvs();
	});

	async function createPlayer(
		overrides: Record<string, unknown> = {},
	) {
		return request(app)
			.post("/admin/players")
			.set("Authorization", adminAuthorization)
			.send({
				name: "Alex Jugador",
				email: "alex@example.com",
				password: "secure-password",
				phone: "+34600111222",
				active: true,
				...overrides,
			});
	}

	function requestFor(
		method: "GET" | "POST" | "PATCH" | "DELETE",
		path: string,
	) {
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

	describe("administrative access", () => {
		it("requires authentication and administrator privileges", async () => {
			const unauthenticated = await request(app).get("/admin/players");
			const nonAdminToken = await createAccessToken(false);
			const nonAdmin = await request(app)
				.get("/admin/players")
				.set("Authorization", `Bearer ${nonAdminToken}`);

			expect(unauthenticated.status).toBe(401);
			expect(unauthenticated.body).toMatchObject({
				code: "AUTHENTICATION_FAILED",
				message: expect.any(String),
			});
			expect(nonAdmin.status).toBe(403);
			expect(nonAdmin.body).toMatchObject({
				code: "FORBIDDEN",
				message: expect.any(String),
			});
		});

		it.each([
			["GET", "/admin/players"],
			["POST", "/admin/players"],
			["GET", `/admin/players/${PLAYER_ID}`],
			["PATCH", `/admin/players/${PLAYER_ID}`],
			["DELETE", `/admin/players/${PLAYER_ID}`],
			["PATCH", `/admin/players/${PLAYER_ID}/status`],
		] as const)("forbids non-admin access to %s %s", async (method, path) => {
			const token = await createAccessToken(false);
			const requestBuilder = requestFor(method, path).set(
				"Authorization",
				`Bearer ${token}`,
			);
			const response = await requestBuilder;

			expect(response.status).toBe(403);
			expect(response.body.code).toBe("FORBIDDEN");
		});
	});

	describe("POST /admin/players", () => {
		it("creates a normalized player without exposing password data", async () => {
			const response = await createPlayer({
				name: " Alex Jugador ",
				email: " ALEX@EXAMPLE.COM ",
				password: "secure-password",
				phone: "+34600111222",
				active: true,
				isAdmin: false,
			});

			expect(response.status).toBe(201);
			expect(response.body).toMatchObject({
				name: "Alex Jugador",
				email: "alex@example.com",
				phone: "+34600111222",
				active: true,
				isAdmin: false,
			});
			expect(response.body.id).toEqual(expect.any(String));
			expect(response.body.createdAt).toEqual(expect.any(String));
			expect(response.body).not.toHaveProperty("password");
			expect(response.body).not.toHaveProperty("passwordHash");

			const login = await request(app).post("/auth/login").send({
				email: "alex@example.com",
				password: "secure-password",
			});
			expect(login.status).toBe(200);
			expect(login.body.accessToken).toEqual(expect.any(String));
		});

		it("rejects invalid input and duplicate normalized emails", async () => {
			const invalid = await createPlayer({ password: "short" });
			expect(invalid.status).toBe(400);
			expect(invalid.body.code).toBe("INVALID_REQUEST");

			await createPlayer();
			const duplicate = await createPlayer({ email: " ALEX@example.com " });
			expect(duplicate.status).toBe(409);
			expect(duplicate.body.code).toBe("CONFLICT");
		});
	});

	describe("GET /admin/players", () => {
		it("lists players without exposing password hashes", async () => {
			const created = await createPlayer();
			const response = await request(app)
				.get("/admin/players")
				.set("Authorization", adminAuthorization);

			expect(created.status).toBe(201);
			expect(response.status).toBe(200);
			expect(response.body).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						id: created.body.id,
						email: "alex@example.com",
					}),
				]),
			);
			for (const player of response.body) {
				expect(player).not.toHaveProperty("passwordHash");
				expect(player).not.toHaveProperty("password");
			}
		});
	});

	describe("GET /admin/players/{playerId}", () => {
		it("returns the requested player and reports unknown players", async () => {
			const created = await createPlayer();
			const found = await request(app)
				.get(`/admin/players/${created.body.id}`)
				.set("Authorization", adminAuthorization);
			const missing = await request(app)
				.get(`/admin/players/${PLAYER_ID}`)
				.set("Authorization", adminAuthorization);

			expect(found.status).toBe(200);
			expect(found.body).toMatchObject({
				id: created.body.id,
				email: "alex@example.com",
			});
			expect(found.body).not.toHaveProperty("passwordHash");
			expect(missing.status).toBe(404);
			expect(missing.body.code).toBe("PLAYER_NOT_FOUND");
		});
	});

	describe("PATCH /admin/players/{playerId}", () => {
		it("updates profile and administrator role fields", async () => {
			const created = await createPlayer();
			const response = await request(app)
				.patch(`/admin/players/${created.body.id}`)
				.set("Authorization", adminAuthorization)
				.send({
					name: "Alex Actualizado",
					email: " alex.updated@example.com ",
					phone: "+34600999888",
					isAdmin: true,
				});

			expect(response.status).toBe(200);
			expect(response.body).toMatchObject({
				id: created.body.id,
				name: "Alex Actualizado",
				email: "alex.updated@example.com",
				phone: "+34600999888",
				isAdmin: true,
			});
			expect(response.body).not.toHaveProperty("passwordHash");
			expect(response.body).not.toHaveProperty("password");

			const login = await request(app).post("/auth/login").send({
				email: "alex.updated@example.com",
				password: "secure-password",
			});
			const adminList = await request(app)
				.get("/admin/players")
				.set("Authorization", `Bearer ${login.body.accessToken}`);
			expect(login.status).toBe(200);
			expect(adminList.status).toBe(200);
		});

		it("rejects empty, unknown, and malformed profile updates", async () => {
			const created = await createPlayer();
			const empty = await request(app)
				.patch(`/admin/players/${created.body.id}`)
				.set("Authorization", adminAuthorization)
				.send({});
			const unknown = await request(app)
				.patch(`/admin/players/${created.body.id}`)
				.set("Authorization", adminAuthorization)
				.send({ password: "password" });
			const invalid = await request(app)
				.patch(`/admin/players/${created.body.id}`)
				.set("Authorization", adminAuthorization)
				.send({ email: "not-an-email" });

			expect(empty.status).toBe(400);
			expect(unknown.status).toBe(400);
			expect(invalid.status).toBe(400);
		});
	});

	describe("PATCH /admin/players/{playerId}/status", () => {
		it("changes active status and can return an inactive player", async () => {
			const created = await createPlayer();
			const response = await request(app)
				.patch(`/admin/players/${created.body.id}/status`)
				.set("Authorization", adminAuthorization)
				.send({ active: false });
			const found = await request(app)
				.get(`/admin/players/${created.body.id}`)
				.set("Authorization", adminAuthorization);

			expect(response.status).toBe(200);
			expect(response.body).toMatchObject({
				id: created.body.id,
				active: false,
			});
			expect(found.status).toBe(200);
			expect(found.body.active).toBe(false);

			const login = await request(app).post("/auth/login").send({
				email: "alex@example.com",
				password: "secure-password",
			});
			expect(login.status).toBe(401);
			expect(login.body.code).toBe("AUTHENTICATION_FAILED");
		});
	});

	describe("DELETE /admin/players/{playerId}", () => {
		it("deletes a player and reports an unknown player", async () => {
			const created = await createPlayer();
			const deleted = await request(app)
				.delete(`/admin/players/${created.body.id}`)
				.set("Authorization", adminAuthorization);
			const missing = await request(app)
				.delete(`/admin/players/${created.body.id}`)
				.set("Authorization", adminAuthorization);

			expect(deleted.status).toBe(204);
			expect(deleted.body).toEqual({});
			expect(missing.status).toBe(404);
			expect(missing.body.code).toBe("PLAYER_NOT_FOUND");
		});
	});
});
