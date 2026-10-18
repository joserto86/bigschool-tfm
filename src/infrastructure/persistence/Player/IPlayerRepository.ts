import {
	Player,
	AdminPlayerCreate,
	PlayerUpdateResult,
	PlayerUpdate
} from "../../../types/player";

export type AdminPlayerStatusUpdateResult =
	| { status: "updated"; player: Player }
	| { status: "not-found" };

export type AdminPlayerDeleteResult = "deleted" | "not-found";

export interface IPlayerRepository {
	list(): Promise<Player[]>;

	findByEmail(email: string): Promise<Player | null>;

	findById(playerId: string): Promise<Player | null>;

	update(
		playerId: string,
		player: PlayerUpdate,
	): Promise<PlayerUpdateResult>;

	create(player: AdminPlayerCreate): Promise<Player | null>;

	updatePlayerStatus(
		playerId: string,
		active: boolean,
	): Promise<AdminPlayerStatusUpdateResult>;

	deletePlayer(playerId: string): Promise<AdminPlayerDeleteResult>;
}
