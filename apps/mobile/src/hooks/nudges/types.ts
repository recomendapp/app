/**
 * A prompt the app raises once and forgets -- a review request, a toast about
 * an optional update.
 *
 * Unlike a `Guard` in `src/guards`, a nudge holds nothing back: it has no route
 * of its own, so it cannot be a `Stack.Protected` destination and is raised
 * imperatively by the runner instead.
 */
export interface AppNudge {
  /** Stable identifier, used to avoid raising the same nudge twice in a row. */
  id: string;
  /** Whether this nudge's condition currently holds. */
  isNeeded: boolean;
  /** Raise it. */
  present: () => void;
}
