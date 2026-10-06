import { Bell, Inbox } from 'lucide-react'
import { notFound } from 'next/navigation'
import { AdminStatusActions, RequestAssignment } from '@/components/requests/request-actions'
import { Dashboard } from '@/components/layout/dashboards'
import { AdminRequestTable } from '@/components/requests/admin-request-table'
import { AdminRequestDashboard } from '@/components/requests/work-dashboards'
import { RequestDetail, type RequestActivityView } from '@/components/requests/request-detail'
import { one } from '@/lib/request-views'
import { RequestForm } from '@/components/requests/request-form'
import { StudentRequestList } from '@/components/requests/request-list'
import { requireProfile } from '@/lib/session'
import { toRequestView, type RequestQueryRow } from '@/lib/request-views'
import { ServiceCatalogue } from '@/components/services/service-catalogue'
import { DepartmentManager, type DepartmentRecord } from '@/components/admin/department-manager'
import { ServiceManager, type ServiceRecord } from '@/components/admin/service-manager'
import { StaffAssignmentDirectory } from '@/components/admin/staff-assignment-directory'
import { OperationsAnalytics } from '@/components/admin/operations-analytics'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
import { NotificationList, type NotificationView } from '@/components/notifications/notification-list'
import { NAV, isRole } from '@/lib/navigation'
import { createClient } from '@/lib/supabase/server'

const REQUEST_SELECTION = `
  id, public_id, student_id, service_id, department_id, assigned_to,
  title, description, location, priority, status, created_at, due_at,
  estimated_completion, escalated,
  service:services!requests_service_id_fkey(name),
  department:departments!requests_department_id_fkey(name),
  assignee:profiles!requests_assigned_to_fkey(full_name,email),
  student:profiles!requests_student_id_fkey(full_name,email)
`

export default async function SectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ role: string; slug?: string[] }>
  searchParams: Promise<{ service?: string }>
}) {
  const [{ role, slug }, query] = await Promise.all([params, searchParams])

  if (!isRole(role)) notFound()

  const key = (slug ?? []).join('/')

  if (key.startsWith('requests/') && key !== 'requests/new') {
    const publicId = key.slice('requests/'.length)
    if (!/^CF-\d+$/.test(publicId)) notFound()

    const profile = await requireProfile()
    const supabase = await createClient()
    const baseQuery = supabase
      .from('requests')
      .select(REQUEST_SELECTION)
      .eq('public_id', publicId)
    const result = role === 'student'
      ? await baseQuery.eq('student_id', profile.id).maybeSingle()
      : await baseQuery.maybeSingle()

    if (result.error || !result.data) notFound()
    const request = toRequestView(result.data as RequestQueryRow)

    const activityQuery = supabase
      .from('request_activity')
      .select('id, kind, message, created_at, actor:profiles!request_activity_actor_id_fkey(full_name)')
      .eq('request_id', request.id)
      .order('created_at', { ascending: true })
    const { data: activityData } = await activityQuery
    const activity = ((activityData ?? []) as Array<{
      id: string
      kind: string
      message: string | null
      created_at: string
      actor: { full_name: string } | { full_name: string }[] | null
    }>).map((entry): RequestActivityView => ({
      id: entry.id,
      kind: entry.kind,
      message: entry.message,
      created_at: entry.created_at,
      actor_name: one(entry.actor)?.full_name ?? null,
    }))

    return (
      <RequestDetail
        request={request}
        activity={activity}
        backHref={`/${role}/requests`}
        actionsTitle="Request management"
        actions={role === 'admin' ? (
          <div className="space-y-6">
            <RequestAssignment
              request={request}
              adminId={profile.id}
              adminName={profile.full_name}
            />
            <div className="border-t border-line pt-5">
              <AdminStatusActions request={request} />
            </div>
          </div>
        ) : undefined}
      />
    )
  }

  const item = NAV[role].find((entry) => entry.slug === key)
  if (role === 'admin' && (key === '' || key === 'dashboard')) {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('requests')
      .select(REQUEST_SELECTION)
      .order('created_at', { ascending: false })

    if (error) {
      return <EmptyState icon={Inbox} title="Unable to load dashboard" body="Please refresh and try again." />
    }

    return (
      <>
        <PageHeader title="Campus operations command center" description="Live request volume, SLA health, and service operations across campus." />
        <AdminRequestDashboard requests={((data ?? []) as RequestQueryRow[]).map(toRequestView)} />
      </>
    )
  }

  if (role === 'student' && (key === '' || key === 'dashboard')) {
    return (
      <>
        <PageHeader title="Student dashboard" description="Your requests and campus services at a glance." />
        <Dashboard />
      </>
    )
  }

  if (!item) notFound()

  if (key === 'notifications') {
    const profile = await requireProfile()
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('notifications')
      .select('id, user_id, request_id, title, body, kind, is_read, created_at')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })

    if (error) {
      return (
        <>
          <PageHeader title="Notifications" description="Updates about your campus requests." />
          <EmptyState icon={Bell} title="Unable to load notifications" body="Please refresh and try again." />
        </>
      )
    }

    const notifications = (data ?? []) as NotificationView[]
    const requestIds = [...new Set(notifications.flatMap((notification) => notification.request_id ? [notification.request_id] : []))]
    let requestLookupWarning: string | undefined

    if (requestIds.length > 0) {
      const { data: requests, error: requestError } = await supabase
        .from('requests')
        .select('id, public_id')
        .in('id', requestIds)

      if (requestError) {
        requestLookupWarning = 'Request links are temporarily unavailable.'
      } else {
        const publicIds = new Map((requests ?? []).map((request) => [request.id, request.public_id]))
        for (const notification of notifications) {
          notification.request_public_id = notification.request_id
            ? publicIds.get(notification.request_id) ?? null
            : null
        }
      }
    }

    return (
      <>
        <PageHeader title="Notifications" description="Updates about your campus requests." />
        <NotificationList
          notifications={notifications}
          role={role}
          requestLookupWarning={requestLookupWarning}
        />
      </>
    )
  }

  if (role === 'admin' && key === 'requests') {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('requests')
      .select(REQUEST_SELECTION)
      .order('created_at', { ascending: false })

    if (error) {
      return <EmptyState icon={Inbox} title="Unable to load requests" body="Please refresh and try again." />
    }

    return (
      <>
        <PageHeader title="Request management" description="Review incoming work and route requests to the right team." />
        <AdminRequestTable requests={((data ?? []) as RequestQueryRow[]).map(toRequestView)} />
      </>
    )
  }

  if (role === 'student' && key === 'requests') {
    const profile = await requireProfile()
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('requests')
      .select(REQUEST_SELECTION)
      .eq('student_id', profile.id)
      .order('created_at', { ascending: false })

    if (error) {
      return <EmptyState icon={Inbox} title="Unable to load requests" body="Please refresh and try again." />
    }

    return (
      <>
        <PageHeader title="My requests" description="Track status, ownership, and resolution targets for your submissions." />
        <StudentRequestList requests={((data ?? []) as RequestQueryRow[]).map(toRequestView)} />
      </>
    )
  }

  if (role === 'student' && key === 'requests/new') {
    const supabase = await createClient()
    const { data: services, error } = await supabase
      .from('services')
      .select('id, name')
      .eq('is_active', true)
      .order('name')

    if (error) {
      return (
        <>
          <PageHeader title="Create a request" description="Describe the problem and CampusFlow will route it." />
          <EmptyState icon={Inbox} title="Unable to load services" body="We couldn't load the campus services right now. Please try again." />
        </>
      )
    }

    return (
      <>
        <PageHeader title="Create a request" description="Describe the problem and CampusFlow will route it." />
        <RequestForm services={services ?? []} initialServiceId={query.service ?? ''} />
      </>
    )
  }

  if (role === 'admin' && key === 'departments') {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('departments')
      .select('id,name,description')
      .order('name')
    if (error) {
      return <EmptyState icon={Inbox} title="Unable to load departments" body="Please refresh and try again." />
    }

    return (
      <>
        <PageHeader title="Departments" description="Organize the teams responsible for campus services." />
        <DepartmentManager initialDepartments={(data ?? []) as DepartmentRecord[]} />
      </>
    )
  }

  if (role === 'admin' && key === 'services') {
    const supabase = await createClient()
    const [serviceResult, departmentResult] = await Promise.all([
      supabase
        .from('services')
        .select('id,name,description,department_id,expected_resolution_hours,requirements,is_active')
        .order('name'),
      supabase.from('departments').select('id,name,description').order('name'),
    ])
    if (serviceResult.error || departmentResult.error) {
      return <EmptyState icon={Inbox} title="Unable to load services" body="Please refresh and try again." />
    }

    return (
      <>
        <PageHeader title="Services" description="Manage service details and what students can request." />
        <ServiceManager
          initialServices={(serviceResult.data ?? []) as ServiceRecord[]}
          departments={(departmentResult.data ?? []) as DepartmentRecord[]}
        />
      </>
    )
  }

  if (role === 'admin' && key === 'staff') {
    const supabase = await createClient()
    const [staffResult, departmentResult] = await Promise.all([
      supabase
        .from('profiles')
        .select('id,full_name,staff_department_id')
        .eq('role', 'staff')
        .order('full_name'),
      supabase.from('departments').select('id,name,description').order('name'),
    ])
    if (staffResult.error || departmentResult.error) {
      return <EmptyState icon={Inbox} title="Unable to load assignment targets" body="Please refresh and try again." />
    }

    return (
      <>
        <PageHeader title="Staff assignment targets" description="Manage which department eligible staff members can receive assignments from." />
        <StaffAssignmentDirectory
          initialStaff={staffResult.data ?? []}
          departments={(departmentResult.data ?? []) as DepartmentRecord[]}
        />
      </>
    )
  }

  if (role === 'admin' && (key === 'analytics' || key === 'escalations')) {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('requests')
      .select(REQUEST_SELECTION)
      .order('created_at', { ascending: false })
    if (error) {
      return <EmptyState icon={Inbox} title="Unable to load request operations" body="Please refresh and try again." />
    }
    const requests = ((data ?? []) as RequestQueryRow[]).map(toRequestView)

    if (key === 'analytics') {
      return (
        <>
          <PageHeader title="Operations analytics" description="Live request volume and SLA indicators from campus requests." />
          <OperationsAnalytics requests={requests} />
        </>
      )
    }

    return (
      <>
        <PageHeader title="Escalations" description="Requests that are past their SLA or have been flagged for escalation." />
        <AdminRequestTable requests={requests} initialSlaFilter="overdue" includeEscalatedInOverdue />
      </>
    )
  }

  if (role === 'student' && key === 'services') {
    const supabase = await createClient()
    const { data: services, error } = await supabase
      .from('services')
      .select(`
        id,
        name,
        description,
        expected_resolution_hours,
        requirements,
        department:departments(name)
      `)
      .eq('is_active', true)
      .order('name')

    if (error) {
      return (
        <>
          <PageHeader title="Campus services" description="Find the right service and start a request." />
          <EmptyState icon={Inbox} title="Unable to load services" body="We couldn't load the campus services right now. Please try again." />
        </>
      )
    }

    return (
      <>
        <PageHeader title="Campus services" description="Find the right service and start a request." />
        <ServiceCatalogue services={services ?? []} />
      </>
    )
  }

  return (
    <>
      <PageHeader title={item.title} description={item.description} />
      {key === '' ? (
        <Dashboard />
      ) : (
        <EmptyState icon={item.icon ?? Inbox} title={item.emptyTitle} body={item.emptyBody} />
      )}
    </>
  )
}