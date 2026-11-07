import { Match, MatchPlayer } from "../../../../types/match";
import { IPlayerRepository } from "../../../persistence/Player/IPlayerRepository";

export async function toMatchResponse(
  match: Match,
  playerRepository: IPlayerRepository,
) {
  const players = await Promise.all(
    match.players.map(async (player: MatchPlayer) => {
      const registeredPlayer = await playerRepository.findById(
        player.playerId,
      );
      return {
        id: player.playerId,
        name: registeredPlayer?.name ?? player.playerId,
        confirmation: player.confirmation ?? null,
        slot: player.slot,
      };
    }),
  );

  return {
    ...match,
    place: match.place ?? null,
    players,
  };
}