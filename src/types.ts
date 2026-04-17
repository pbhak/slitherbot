export type Snake = {
  /** Snake ID */
  id: number;
  /** Angle of snake (radians) */
  angle: number;
  /** Kill count of snake */
  killCount: number;
  /** Snake nickname */
  nick: string;
  /** Snake speed */
  speed: number;
  /** Snake length */
  length: number;
  /** Snake X position on global board */
  x: number;
  /** Snake Y position on global board */
  y: number;
};

export type Pellet = {
  /** Pellet ID */
  id: number;
  /** Pellet X position on global board */
  x: number;
  /** Pellet Y position on global board */
  y: number;
  /** Pellet size */
  size: number;
};

export type GameState = {
  /** Current snake object */
  snake: Snake;
  /** Currently visible pellets */
  pellets: Pellet[];
}