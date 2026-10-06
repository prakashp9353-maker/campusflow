import 'server-only'

export type NotificationEmailEvent = {
  id: string
  kind: string
  title: string
  body: string
  requestPublicId: string
  requestTitle: string
  requestStatus: string
  recipientEmail: string
}

export type EmailDispatchResult = 'sent' | 'skipped'

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character] ?? character)
}

function getConfiguration() {
  const apiKey = process.env.EMAIL_PROVIDER_API_KEY
  const from = process.env.EMAIL_FROM
  const appUrl = process.env.APP_URL
  if (!apiKey || !from || !appUrl) {
    console.warn('Email dispatch skipped: configure EMAIL_PROVIDER_API_KEY, EMAIL_FROM, and APP_URL.')
    return null
  }

  let baseUrl: URL
  try {
    baseUrl = new URL(appUrl)
  } catch {
    console.warn('Email dispatch skipped: APP_URL must be a valid absolute URL.')
    return null
  }
  if (baseUrl.protocol !== 'https:' && baseUrl.protocol !== 'http:') {
    console.warn('Email dispatch skipped: APP_URL must use HTTP or HTTPS.')
    return null
  }
  return { apiKey, from, baseUrl: baseUrl.origin }
}

export async function sendNotificationEmail(event: NotificationEmailEvent): Promise<EmailDispatchResult> {
  const config = getConfiguration()
  if (!config) return 'skipped'

  const requestUrl = `${config.baseUrl}/student/requests/${encodeURIComponent(event.requestPublicId)}`
  const safe = {
    title: escapeHtml(event.title),
    body: escapeHtml(event.body),
    requestPublicId: escapeHtml(event.requestPublicId),
    requestTitle: escapeHtml(event.requestTitle),
    requestStatus: escapeHtml(event.requestStatus.replaceAll('_', ' ')),
    requestUrl: escapeHtml(requestUrl),
  }
  const html = `
    <div style="margin:0;background:#070a10;padding:36px 16px;color:#eef3fa;font-family:Arial,sans-serif">
      <div style="max-width:600px;margin:0 auto;border:1px solid #1f2a3b;border-radius:16px;background:#0d121b;overflow:hidden">
        <div style="padding:24px 28px;border-bottom:1px solid #1f2a3b">
          <p style="margin:0;color:#64d7ff;font-size:13px;font-weight:700;letter-spacing:1.5px">CAMPUSFLOW AI</p>
          <h1 style="margin:20px 0 0;font-size:22px;line-height:1.35">${safe.title}</h1>
        </div>
        <div style="padding:24px 28px">
          <p style="margin:0;color:#c4cede;font-size:15px;line-height:1.7;white-space:pre-wrap">${safe.body}</p>
          <div style="margin-top:24px;padding:16px;border:1px solid #1f2a3b;border-radius:10px;background:#131a27">
            <p style="margin:0;color:#9aa8bd;font-size:12px">REQUEST ${safe.requestPublicId}</p>
            <p style="margin:8px 0;color:#eef3fa;font-size:15px;font-weight:600">${safe.requestTitle}</p>
            <p style="margin:0;color:#9aa8bd;font-size:13px">Current status: ${safe.requestStatus}</p>
          </div>
          <a href="${safe.requestUrl}" style="display:inline-block;margin-top:24px;padding:12px 18px;border-radius:8px;background:#4f9cff;color:#070a10;font-size:14px;font-weight:700;text-decoration:none">View request</a>
        </div>
        <div style="padding:16px 28px;border-top:1px solid #1f2a3b;color:#6b7a90;font-size:12px">CampusFlow AI · Campus services, clearly connected.</div>
      </div>
    </div>
  `
  const text = [
    'CampusFlow AI',
    event.title,
    event.body,
    `Request: ${event.requestPublicId} · ${event.requestTitle}`,
    `Current status: ${event.requestStatus.replaceAll('_', ' ')}`,
    `View request: ${requestUrl}`,
  ].join('\n\n')

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': event.id,
    },
    body: JSON.stringify({
      from: config.from,
      to: [event.recipientEmail],
      subject: `${event.title} · ${event.requestPublicId}`,
      html,
      text,
    }),
    signal: AbortSignal.timeout(8_000),
  })

  if (!response.ok) throw new Error(`Email provider returned HTTP ${response.status}.`)
  return 'sent'
}
