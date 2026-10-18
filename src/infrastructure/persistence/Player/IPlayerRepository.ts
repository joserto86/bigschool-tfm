import { Player, PlayerProfileUpdate, PlayerProfileUpdateResult } from "../../../types/player";

export interface IPlayerRepository {
  findByEmail(email: string): Promise<Player | null>;
  
  findById(playerId: string): Promise<Player | null>;
  
  update(playerId: string, player: PlayerProfileUpdate): Promise<PlayerProfileUpdateResult>;
}
