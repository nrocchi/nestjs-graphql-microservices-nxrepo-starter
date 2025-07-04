/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Apollo Federation v2 Types
 * These types are required for Apollo Federation resolvers
 */

export interface I_Service {
  sdl: string
}

export interface IQuery__EntitiesArgs {
  representations: ReadonlyArray<any>
}
