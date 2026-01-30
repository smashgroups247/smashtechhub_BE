// src/domain/contact/types/index.ts

/**
 * Contact Submission Interface
 */
export interface IContact {
  _id?: string;
  fullName: string;
  email: string;
  serviceOfInterest: string;
  projectDetails: string;
  status: 'new' | 'in-progress' | 'resolved';
  adminNotes?: string;
  resolvedBy?: string;
  resolvedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

/**
 * Create Contact Request
 */
export interface CreateContactRequest {
  fullName: string;
  email: string;
  serviceOfInterest: string;
  projectDetails: string;
}

/**
 * Update Contact Status Request
 */
export interface UpdateContactStatusRequest {
  status: 'new' | 'in-progress' | 'resolved';
  adminNotes?: string;
  resolvedBy?: string;
}

/**
 * Contact Query Filters
 */
export interface ContactQueryFilters {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  status?: 'new' | 'in-progress' | 'resolved';
  startDate?: string;
  endDate?: string;
  search?: string;
}

/**
 * Contact Response
 */
export interface ContactResponse {
  _id: string;
  fullName: string;
  email: string;
  serviceOfInterest: string;
  projectDetails: string;
  status: 'new' | 'in-progress' | 'resolved';
  adminNotes?: string;
  resolvedBy?: string;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Paginated Contact Response
 */
export interface PaginatedContactResponse {
  data: ContactResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Service of Interest Options
 */
export const SERVICE_OPTIONS = [
  'Web Development',
  'Mobile App Development',
  'UI/UX Design',
  'Digital Marketing',
  'E-commerce Solutions',
  'Custom Software',
  'Consulting',
  'Other',
] as const;

export type ServiceOfInterest = typeof SERVICE_OPTIONS[number];