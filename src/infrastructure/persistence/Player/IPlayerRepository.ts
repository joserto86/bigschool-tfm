import { Player, PlayerProfileUpdate, PlayerProfileUpdateResult } from "../../../types/player";

export interface IPlayerRepository {
  findUserByEmail(email: string): Promise<Player | null>;
  findUserById(playerId: string): Promise<Player | null>;
  
  updatePlayerProfile( playerId: string, player: PlayerProfileUpdate): Promise<PlayerProfileUpdateResult>;
}
