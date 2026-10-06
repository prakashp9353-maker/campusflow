import type { LucideIcon } from 'lucide-react'
import {
  AlertTriangle, BarChart3, Bell, Building2, Home, Layers3, PlusCircle, Settings2,
  Sparkles, Ticket, UserRound, Users,
} from 'lucide-react'
import type { AppRole } from './types'

export type NavItem = {
  slug: string
  label: string
  icon: LucideIcon
  title: string
  description: string
  emptyTitle: string
  emptyBody: string
}

const dashboard = (description: string): NavItem => ({
  slug: 'dashboard', label: 'Dashboard', icon: Home, title: 'Dashboard', description,
  emptyTitle: '', emptyBody: '',
})

const notifications: NavItem = {
  slug: 'notifications', label: 'Notifications', icon: Bell, title: 'Notifications',
  description: 'Updates on your requests and campus announcements.',
  emptyTitle: 'You are all caught up',
  emptyBody: 'New notifications appear here as requests move forward.',
}
const settings: NavItem = {
  slug: 'settings', label: 'Settings', icon: Settings2, title: 'Settings',
  description: 'Manage your preferences.',
  emptyTitle: 'Nothing to configure yet', emptyBody: 'Account and notification settings will appear here.',
}
const profile: NavItem = {
  slug: 'profile', label: 'Profile', icon: UserRound, title: 'Profile',
  description: 'Your account details.',
  emptyTitle: 'Profile unavailable', emptyBody: 'Sign in to view your profile.',
}

export const NAV: Record<AppRole, NavItem[]> = {
  student: [
    dashboard('Your requests and campus services at a glance.'),
    { slug: 'services', label: 'Services', icon: Layers3, title: 'Campus services',
      description: 'Find the right service and start a request.',
      emptyTitle: 'No services published yet', emptyBody: 'Services added by administrators will be listed here.' },
    { slug: 'requests/new', label: 'Create Request', icon: PlusCircle, title: 'Create a request',
      description: 'Describe the problem and CampusFlow will route it.',
      emptyTitle: 'Request form coming online', emptyBody: 'The request form needs the services directory first.' },
    { slug: 'requests', label: 'My Requests', icon: Ticket, title: 'My requests',
      description: 'Track every request from submission to resolution.',
      emptyTitle: 'No requests yet', emptyBody: 'Requests you submit will appear here with live status.' },
    notifications, profile, settings,
  ],
  admin: [
    dashboard('Campus requests, assignments and service operations at a glance.'),
    { slug: 'requests', label: 'Requests', icon: Ticket, title: 'Request management',
      description: 'Search, filter, assign and resolve campus requests.',
      emptyTitle: 'No requests have been submitted', emptyBody: 'Incoming requests will appear here for assignment.' },
    { slug: 'departments', label: 'Departments', icon: Building2, title: 'Departments',
      description: 'Teams that own campus services.',
      emptyTitle: 'No departments yet', emptyBody: 'Create departments before publishing services.' },
    { slug: 'staff', label: 'Staff', icon: Users, title: 'Staff',
      description: 'Manage eligible staff assignment targets.',
      emptyTitle: 'No staff members yet', emptyBody: 'Eligible staff assignment targets will appear here.' },
    { slug: 'services', label: 'Services', icon: Layers3, title: 'Services',
      description: 'Manage the service catalogue students see.',
      emptyTitle: 'No services yet', emptyBody: 'Add the first service to open the catalogue to students.' },
    { slug: 'analytics', label: 'Analytics', icon: BarChart3, title: 'Analytics',
      description: 'Volume, resolution time and workload trends.',
      emptyTitle: 'Not enough data for analytics', emptyBody: 'Charts appear once requests have been submitted.' },
    { slug: 'insights', label: 'AI Insights', icon: Sparkles, title: 'AI insights',
      description: 'Trends, bottlenecks and recommendations from live data.',
      emptyTitle: 'No insights yet', emptyBody: 'Insights are generated once there is enough request history.' },
    { slug: 'escalations', label: 'Escalations', icon: AlertTriangle, title: 'Escalations',
      description: 'Overdue and escalated requests that need action.',
      emptyTitle: 'No escalations', emptyBody: 'Requests that miss their SLA will be listed here.' },
    notifications, settings,
  ],
}

export function isRole(value: string): value is AppRole {
  return value === 'student' || value === 'admin'
}
