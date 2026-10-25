import { MatchStatus } from "../../../types/match";

export class InvalidAdminMatchRequestError extends Error {
	constructor() {
		super("The match request is invalid.");
		this.name = "InvalidAdminMatchRequestError";
	}
}

export class AdminMatchPlayerNotFoundError extends Error {
	constructor(playerId: string) {
		super(`Player '${playerId}' was not found.`);
		this.name = "AdminMatchPlayerNotFoundError";
	}
}

export class AdminMatchPlayerNotRegisteredError extends Error {
	constructor(playerId: string, matchId: string) {
		super(`Player '${playerId}' is not registered in match '${matchId}'.`);
		this.name = "AdminMatchPlayerNotRegisteredError";
	}
}

export class AdminMatchPlayerRemovalNotAllowedError extends Error {
	constructor() {
		super(
			"A player cannot be removed while the match is CONFIRMED or CANCELLED.",
		);
		this.name = "AdminMatchPlayerRemovalNotAllowedError";
	}
}

export class InvalidAdminMatchTransitionError extends Error {
	constructor(from: MatchStatus, to: MatchStatus) {
		super(`The transition from '${from}' to '${to}' is not allowed.`);
		this.name = "InvalidAdminMatchTransitionError";
	}
}

export class AdminMatchPlayerAlreadyRegisteredError extends Error {
	constructor(playerId: string, matchId: string) {
		super(`Player '${playerId}' is already registered in match '${matchId}'.`);
		this.name = "AdminMatchPlayerAlreadyRegisteredError";
	}
}

export class AdminMatchFullError extends Error {
	constructor(matchId: string) {
		super(`Match '${matchId}' already has 4 players.`);
		this.name = "AdminMatchFullError";
	}
}

export class AdminMatchRequiresFourPlayersError extends Error {
	constructor() {
		super("A match must have exactly 4 players to transition to COMPLETED.");
		this.name = "AdminMatchRequiresFourPlayersError";
	}
}

