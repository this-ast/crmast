import type { UserRole } from '@/types'

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Администратор',
  agency_owner: 'Владелец агентства',
  agency_manager: 'Руководитель',
  realtor: 'Риэлтор',
  viewer: 'Наблюдатель',
}

type Permission =
  | 'agencies.view'
  | 'agencies.edit'
  | 'agencies.manage_users'
  | 'profiles.view_all'
  | 'profiles.edit_own'
  | 'profiles.edit_all'
  | 'properties.view_own'
  | 'properties.view_agency'
  | 'properties.create'
  | 'properties.edit_own'
  | 'properties.edit_agency'
  | 'properties.delete'
  | 'clients.view_own'
  | 'clients.view_agency'
  | 'clients.create'
  | 'clients.edit_own'
  | 'clients.edit_agency'
  | 'clients.delete'
  | 'deals.view_own'
  | 'deals.view_agency'
  | 'deals.create'
  | 'deals.edit_own'
  | 'deals.edit_agency'
  | 'deals.delete'
  | 'documents.view'
  | 'documents.create'
  | 'documents.edit'
  | 'documents.delete'
  | 'reports.view'
  | 'reports.export'
  | 'settings.view'
  | 'settings.edit'
  | 'admin.full_access'

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: ['admin.full_access'],

  agency_owner: [
    'agencies.view', 'agencies.edit', 'agencies.manage_users',
    'profiles.view_all', 'profiles.edit_own', 'profiles.edit_all',
    'properties.view_agency', 'properties.create', 'properties.edit_agency', 'properties.delete',
    'clients.view_agency', 'clients.create', 'clients.edit_agency', 'clients.delete',
    'deals.view_agency', 'deals.create', 'deals.edit_agency', 'deals.delete',
    'documents.view', 'documents.create', 'documents.edit', 'documents.delete',
    'reports.view', 'reports.export',
    'settings.view', 'settings.edit',
  ],

  agency_manager: [
    'agencies.view',
    'profiles.view_all', 'profiles.edit_own',
    'properties.view_agency', 'properties.create', 'properties.edit_agency',
    'clients.view_agency', 'clients.create', 'clients.edit_agency',
    'deals.view_agency', 'deals.create', 'deals.edit_agency',
    'documents.view', 'documents.create', 'documents.edit',
    'reports.view', 'reports.export',
    'settings.view',
  ],

  realtor: [
    'agencies.view',
    'profiles.edit_own',
    'properties.view_own', 'properties.create', 'properties.edit_own',
    'clients.view_own', 'clients.create', 'clients.edit_own',
    'deals.view_own', 'deals.create', 'deals.edit_own',
    'documents.view', 'documents.create',
    'reports.view',
    'settings.view',
  ],

  viewer: [
    'agencies.view',
    'properties.view_own',
    'clients.view_own',
    'deals.view_own',
    'reports.view',
  ],
}

export function hasPermission(role: UserRole, permission: Permission): boolean {
  if (role === 'admin') return true
  return ROLE_PERMISSIONS[role].includes(permission)
}

export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  if (role === 'admin') return true
  return permissions.some((p) => ROLE_PERMISSIONS[role].includes(p))
}

export function isManagerOrAbove(role: UserRole): boolean {
  return ['admin', 'agency_owner', 'agency_manager'].includes(role)
}
