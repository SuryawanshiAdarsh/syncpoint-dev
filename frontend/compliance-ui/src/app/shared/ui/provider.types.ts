/** Shared provider identifiers used by ui-provider-logo and elsewhere. */
export type IntegrationProvider = 'GITHUB' | 'AWS' | 'JIRA' | 'GOOGLE_WORKSPACE';

export interface ProviderMeta {
  key: IntegrationProvider;
  name: string;
  description: string;
  available: boolean;
  scopes?: string[];
}

export const PROVIDER_CATALOG: readonly ProviderMeta[] = [
  {
    key: 'GITHUB',
    name: 'GitHub',
    description: 'Collect organization members, repository visibility, and branch-protection settings.',
    available: true,
    scopes: ['read:org', 'repo', 'read:user'],
  },
  {
    key: 'AWS',
    name: 'Amazon Web Services',
    description: 'Collect IAM users, roles, MFA status, and CloudTrail configuration via cross-account IAM Role.',
    available: false,
  },
  {
    key: 'JIRA',
    name: 'Jira',
    description: 'Collect change-management tickets, approvals, and workflow states via OAuth.',
    available: false,
  },
  {
    key: 'GOOGLE_WORKSPACE',
    name: 'Google Workspace',
    description: 'Collect users, groups, 2-step verification status, and admin roles via OAuth.',
    available: false,
  },
] as const;
