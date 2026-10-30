// The server's state machines, for UI previews only: the admin UI shows the moves the server will accept.
// The server decides; a preview that disagrees with it is a bug caught by the shared vectors.

import type { InstanceStatus, TaskStatus } from './model.js'

/** Task moves the admin API accepts (blocked also needs a reason; starting or finishing needs every
 * dependency done). */
export const TASK_TRANSITIONS: ReadonlyArray<readonly [TaskStatus, TaskStatus]> = [
  ['planned', 'ready'],
  ['planned', 'in_progress'],
  ['planned', 'blocked'],
  ['ready', 'planned'],
  ['ready', 'in_progress'],
  ['ready', 'blocked'],
  ['in_progress', 'ready'],
  ['in_progress', 'done'],
  ['in_progress', 'blocked'],
  ['done', 'in_progress'],
  ['blocked', 'planned'],
  ['blocked', 'ready'],
  ['blocked', 'in_progress'],
]

/** Who asks for an instance move. */
export type Actor = 'operator' | 'worker' | 'janitor'

/** Instance moves, with the only actor allowed to make each. `unknown` is left only by an operator's
 * resolution, never by an automatic retry. */
export const INSTANCE_TRANSITIONS: ReadonlyArray<readonly [InstanceStatus, InstanceStatus, Actor]> = [
  ['planned', 'queued', 'operator'],
  ['planned', 'manual_required', 'operator'],
  ['planned', 'cancelled', 'operator'],
  ['queued', 'sending', 'worker'],
  ['queued', 'manual_required', 'worker'],
  ['queued', 'planned', 'operator'],
  ['queued', 'cancelled', 'operator'],
  ['sending', 'posted', 'worker'],
  ['sending', 'failed', 'worker'],
  ['sending', 'queued', 'worker'],
  ['sending', 'unknown', 'worker'],
  ['sending', 'unknown', 'janitor'],
  ['failed', 'queued', 'operator'],
  ['failed', 'manual_required', 'operator'],
  ['failed', 'cancelled', 'operator'],
  ['unknown', 'posted', 'operator'],
  ['unknown', 'failed', 'operator'],
  ['manual_required', 'posted', 'operator'],
  ['manual_required', 'planned', 'operator'],
  ['manual_required', 'cancelled', 'operator'],
  ['cancelled', 'planned', 'operator'],
]

export function taskMoveAllowed(from: TaskStatus, to: TaskStatus): boolean {
  return TASK_TRANSITIONS.some(([f, t]) => f === from && t === to)
}

/** The statuses an operator can move an instance to from `from` (what the admin UI offers). */
export function operatorMoves(from: InstanceStatus): InstanceStatus[] {
  return INSTANCE_TRANSITIONS.filter(([f, , a]) => f === from && a === 'operator').map(([, t]) => t)
}
