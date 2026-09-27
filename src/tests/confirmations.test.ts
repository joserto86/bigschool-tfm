import request from "supertest";
import { Application } from "express";
import { beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../app";

describe("Confirmations API", () => {
	let app: Application;

	beforeEach(() => {
		app = createApp();
	});

	async function createCompletedMatch() {
		const created = await request(app)
			.post("/matches")
			.send({ dateTime: "2026-10-10T18:00:00+02:00" });
		const matchId = created.body.id as string;

		for (const playerId of ["player-1", "player-2", "player-3", "player-4"]) {
			await request(app)
				.post(`/matches/${matchId}/players`)
				.send({ playerId });
		}

		return matchId;
	}

	describe("POST /matches/{matchId}/confirmation", () => {
		it("keeps the match COMPLETED while confirmations are pending", async () => {
			const matchId = await createCompletedMatch();

			const response = await request(app)
				.post(`/matches/${matchId}/confirmation`)
				.send({ playerId: "player-1", decision: "CONFIRMED" });

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
					.send({ playerId, decision: "CONFIRMED" });
			}

			expect(response?.status).toBe(200);
			expect(response?.body.matchStatus).toBe("CONFIRMED");
		});

		it("transitions the match to CANCELLED as soon as one player declines", async () => {
			const matchId = await createCompletedMatch();
			await request(app)
				.post(`/matches/${matchId}/confirmation`)
				.send({ playerId: "player-1", decision: "CONFIRMED" });

			const response = await request(app)
				.post(`/matches/${matchId}/confirmation`)
				.send({ playerId: "player-2", decision: "DECLINED" });

			expect(response.status).toBe(200);
			expect(response.body.matchStatus).toBe("CANCELLED");
		});

		it("rejects confirming a match that is not COMPLETED", async () => {
			const created = await request(app)
				.post("/matches")
				.send({ dateTime: "2026-10-20T18:00:00+02:00" });

			const response = await request(app)
				.post(`/matches/${created.body.id}/confirmation`)
				.send({ playerId: "player-1", decision: "CONFIRMED" });

			expect(response.status).toBe(409);
		});

		it("rejects a decision from a player that does not belong to the match", async () => {
			const matchId = await createCompletedMatch();

			const response = await request(app)
				.post(`/matches/${matchId}/confirmation`)
				.send({ playerId: "player-99", decision: "CONFIRMED" });

			expect(response.status).toBe(409);
		});

		it("returns 404 when the match does not exist", async () => {
			const response = await request(app)
				.post("/matches/does-not-exist/confirmation")
				.send({ playerId: "player-1", decision: "CONFIRMED" });

			expect(response.status).toBe(404);
		});
	});
});