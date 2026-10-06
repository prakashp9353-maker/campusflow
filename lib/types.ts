export type Role = 'student' | 'staff' | 'admin'
export type AppRole = 'student' | 'admin'

export type Priority = 'critical' | 'high' | 'medium' | 'low'

/** The four workflow states. Escalation is a flag on a request, not a status. */
export type RequestStatus = 'pending' | 'assigned' | 'in_progress' | 'completed'

export type SlaState = 'on_track' | 'warning' | 'overdue' | 'closed'

export type NotificationKind =
  | 'request_submitted'
  | 'request_assigned'
  | 'status_changed'
  | 'request_completed'
  | 'sla_warning'
  | 'request_escalated'
  | 'ai_recommendation'
  | 'announcement'
