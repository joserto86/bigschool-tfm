export class MatchNotCompletedError extends Error {
	constructor(matchId: string) {
		super(`Match '${matchId}' is not completed.`);
		this.name = "MatchNotCompletedError";
	}
}

export class PlayerNotInMatchError extends Error {
	constructor(playerId: string, matchId: string) {
		super(`Player '${playerId}' is not registered in match '${matchId}'.`);
		this.name = "PlayerNotInMatchError";
	}
}

export class InvalidMatchDateTimeError extends Error {
	constructor() {
		super("The request is invalid.");
		this.name = "InvalidMatchDateTimeError";
	}
}

export class MatchNotFoundError extends Error {
	constructor(matchId: string) {
		super(`Match '${matchId}' was not found.`);
		this.name = "MatchNotFoundError";
	}
}

export class MissingDateTimeQueryError extends Error {
  constructor() {
    super("The request is invalid.");
    this.name = "MissingDateTimeQueryError";
  }
}

export class MatchNotOpenError extends Error {
  constructor(matchId: string) {
    super(`Match '${matchId}' is not open for registration.`);
    this.name = "MatchNotOpenError";
  }
}