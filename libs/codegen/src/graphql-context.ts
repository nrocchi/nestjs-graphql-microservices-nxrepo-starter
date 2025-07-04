export interface IGraphQLContext {
  req?: {
    headers: Record<string, string | string[] | undefined>
    body?: unknown
    query?: Record<string, unknown>
  }
  res?: {
    status: (code: number) => unknown
    json: (data: unknown) => unknown
  }
}
