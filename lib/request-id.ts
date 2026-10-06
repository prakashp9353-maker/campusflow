/** Display format for request IDs. The number itself is issued by a database sequence. */
export const REQUEST_ID_PREFIX = 'CF-'
export const REQUEST_ID_START = 10001

export function formatRequestId(sequence: number): string {
  return `${REQUEST_ID_PREFIX}${sequence}`
}

export function isRequestId(value: string): boolean {
  return /^CF-\d{5,}$/.test(value)
}
