export const TAB_SESSION_KEY = 'campusflow-tab-session'

export function establishTabSession(): void {
  sessionStorage.setItem(TAB_SESSION_KEY, window.crypto.randomUUID())
}
