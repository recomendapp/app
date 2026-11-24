import type { Href } from 'expo-router';

export type GuardId = 'version';

/**
 * One guard's own answer: whether it must hold the app behind its own screen.
 *
 * Unlike an `AppGate` in `hooks/gates` -- a dismissible nudge the runner
 * presents once and forgets -- a guard hides the rest of the app until it is no
 * longer needed. `GuardProvider` ranks these and names the winner; the root
 * layout opens that guard's screen and the router sends everyone else to it.
 */
export type Guard = {
  id: GuardId;
  isNeeded: boolean;
  /** Where a reader this guard holds belongs. */
  route: Extract<Href, string>;
};
