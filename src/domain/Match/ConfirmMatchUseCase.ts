import { IMatchRepository } from "../../infrastructure/persistence/Match/IMatchRepository";
import { ConfirmMatchInputDto } from "./dto/ConfirmMatchInputDto";
import { ConfirmMatchResultDto } from "./dto/ConfirmMatchResultDto";
import { MatchNotCompletedError, MatchNotFoundError, PlayerNotInMatchError } from "./error/error";
export class ConfirmMatchUseCase {
	constructor(private readonly matchRepository: IMatchRepository) {}

	async execute(input: ConfirmMatchInputDto): Promise<ConfirmMatchResultDto> {
		const { matchId, playerId, decision } = input;
		const match = await this.matchRepository.findById(matchId);

		if (!match) {
			throw new MatchNotFoundError(matchId);
		}

		if (match.status !== "COMPLETED") {
			throw new MatchNotCompletedError(matchId);
		}

		const player = match.players.find((p) => p.playerId === playerId);

		if (!player) {
			throw new PlayerNotInMatchError(playerId, matchId);
		}

		player.confirmation = decision;

		if (decision === "DECLINED") {
			match.status = "CANCELLED";
		} else if (match.players.every((p) => p.confirmation === "CONFIRMED")) {
			match.status = "CONFIRMED";
		}

		const result = await this.matchRepository.update(match);

		return {
			matchId: result.id,
			playerId,
			decision,
			matchStatus: result.status,
		};
	}
}
