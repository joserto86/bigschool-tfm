import { IMatchRepository } from "../../infrastructure/persistence/Match/IMatchRepository";
import { LeaveMatchInputDto } from "./dto/LeaveMatchInputDto";
import { MatchNotFoundError, MatchNotOpenError, PlayerNotInMatchError } from "./error/error";

export class LeaveMatchUseCase {
	constructor(private readonly matchRepository: IMatchRepository) {}

	async execute(input: LeaveMatchInputDto): Promise<void> {
		const { matchId, playerId } = input;
		const match = await this.matchRepository.findById(matchId);

		if (!match) {
			throw new MatchNotFoundError(matchId);
		}

		const playerIndex = match.players.findIndex(
			(player) => player.playerId === playerId,
		);

		if (playerIndex === -1) {
			throw new PlayerNotInMatchError(playerId, matchId);
		}

		if (match.status !== "OPEN") {
			throw new MatchNotOpenError(matchId);
		}

		match.players.splice(playerIndex, 1);

		if (match.players.length === 0) {
			await this.matchRepository.deleteById(matchId);
		}
	}
}
