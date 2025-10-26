export interface PaginationArgs {
  limit?: number;
  offset?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface GraphQLContext {
  userId?: string;
}

export * from './request';
export * from './tools';
