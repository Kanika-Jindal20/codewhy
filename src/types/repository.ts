export interface RepositoryLookupRequest {
  url: string;
}

export interface RepositoryMetadata {
  githubRepositoryId: number;
  owner: string;
  name: string;
  url: string;
  description: string | null;
  primaryLanguage: string | null;
  defaultBranch: string;
}

export interface RepositoryLookupResponse {
  repository: RepositoryMetadata;
}

export type RepositoryLookupErrorCode =
  | 'INVALID_REPOSITORY_URL'
  | 'REPOSITORY_NOT_FOUND'
  | 'GITHUB_RATE_LIMITED'
  | 'GITHUB_UNAVAILABLE'
  | 'INTERNAL_ERROR';

export interface RepositoryLookupErrorResponse {
  error: {
    code: RepositoryLookupErrorCode;
    message: string;
  };
}
