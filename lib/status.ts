import type { RequestStatus, Role } from './types'

/** Every legal move in the workflow, regardless of who performs it. */
const EDGES: Record<RequestStatus, readonly RequestStatus[]> = {
  pending: ['assigned'],
  assigned: ['in_progress', 'pending'],
  in_progress: ['completed', 'assigned'],
  completed: [],
}

/** Moves each role may perform. Students never change status. */
const ROLE_MOVES: Record<Role, ReadonlyArray<readonly [RequestStatus, RequestStatus]>> = {
  student: [],
  staff: [
    ['assigned', 'in_progress'],
    ['in_progress', 'completed'],
  ],
  admin: Object.entries(EDGES).flatMap(([from, tos]) =>
    tos.map((to) => [from, to] as const),
  ) as Array<readonly [RequestStatus, RequestStatus]>,
}

export function canTransition(role: Role, from: RequestStatus, to: RequestStatus): boolean {
  if (!EDGES[from].includes(to)) return false
  return ROLE_MOVES[role].some(([f, t]) => f === from && t === to)
}

export function nextStatuses(role: Role, from: RequestStatus): RequestStatus[] {
  return EDGES[from].filter((to) => canTransition(role, from, to))
}
