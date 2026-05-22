/**
 * Shared TypeScript Types for GeoKollect
 * Used by both frontend and backend
 */

export interface WasteSiteRecord {
  id?: string;
  // Location & Household
  latitude: number;
  longitude: number;
  ward: 'Tezo' | 'Sokoni';
  settlement_type: 'Formal' | 'Informal' | 'Peri-urban';
  household_size: '1-3' | '4-6' | '7+';

  // Waste Generation
  waste_types: ('Organic' | 'Plastics' | 'Glass' | 'Metal' | 'Hazardous' | 'Liquid')[];
  waste_quantity: '<1kg' | '1-3kg' | '3-5kg' | '>5kg';
  waste_separation: boolean;

  // Disposal Practices
  disposal_method: 'County collection' | 'Private collector' | 'Open dumping' | 'Burning' | 'Burying' | 'Drainage disposal';
  distance_to_site: '<100m' | '100-500m' | '500m-1km' | '>1km';
  collection_frequency: 'Daily' | 'Weekly' | 'Monthly' | 'Not collected';

  // Accessibility
  road_access: 'Good' | 'Fair' | 'Poor';
  distance_to_road: '<50m' | '50-200m' | '>200m';

  // Environmental Risk
  waste_near_home: boolean;
  distance_to_waste: '<50m' | '50-200m' | '>200m';
  impacts: ('Bad odour' | 'Water contamination' | 'Air pollution' | 'Flooding' | 'Disease')[];
  nearby_features: ('River/stream' | 'Wetland' | 'Ocean/creek' | 'None')[];

  // Suitability Perception
  recommended_distance: '<200m' | '200-500m' | '500m-1km' | '>1km';
  preferred_location: ('Far from settlements' | 'Near roads' | 'Away from water' | 'Unused land' | 'Industrial area')[];
  distance_weight: number; // 1-5
  water_weight: number; // 1-5
  road_weight: number; // 1-5
  slope_weight: number; // 1-5
  landuse_weight: number; // 1-5

  // Topography
  terrain: 'Flat' | 'Gentle slope' | 'Steep slope';
  flooding: 'Never' | 'Occasionally' | 'Frequently';

  // Community & Policy
  policy_awareness: boolean;
  support_new_site: 'Yes' | 'No' | 'Not sure';
  preferred_management: 'Recycling' | 'Composting' | 'Landfill' | 'Incineration';

  // Open Ended
  challenges: string;
  suggested_location: string;

  // Images & Enumerator
  image_url?: string;
  enumerator_email?: string;

  // Quality Scoring (NEW)
  quality_score?: number;
  quality_issues?: string[];
  is_flagged?: boolean;
  flag_reason?: string;

  // Metadata
  created_at?: string;
  updated_at?: string;
}

export interface UserRole {
  id?: number;
  email: string;
  name: string;
  role: 'admin' | 'supervisor' | 'enumerator';
  ward?: string;
  permissions?: {
    view_records: boolean;
    create_records: boolean;
    edit_records: boolean;
    delete_records: boolean;
    view_assignments: boolean;
    create_assignments: boolean;
    view_comments: boolean;
    create_comments: boolean;
    delete_comments: boolean;
    view_notifications: boolean;
    manage_users: boolean;
    export_data: boolean;
    generate_reports: boolean;
  };
}

export interface EnumeratorAssignment {
  id?: number;
  enumerator_id: number;
  enumerator_email?: string;
  enumerator_name?: string;
  ward: string;
  assigned_at?: string;
  assigned_by?: number;
  status: 'active' | 'paused' | 'completed';
  target_records?: number;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface RecordComment {
  id?: number;
  waste_site_id: number;
  author_id: number;
  author_email: string;
  author_name: string;
  content: string;
  comment_type: 'general' | 'flag' | 'feedback' | 'correction';
  created_at?: string;
  updated_at?: string;
  deleted_at?: string;
}

export interface Notification {
  id?: number;
  recipient_id: number;
  recipient_email: string;
  subject: string;
  message: string;
  notification_type: 'assignment' | 'feedback' | 'record_flag' | 'approval' | 'alert' | 'system';
  related_record_id?: number;
  related_assignment_id?: number;
  is_read: boolean;
  sent_at?: string;
  read_at?: string;
  created_at?: string;
}

export interface OfflineQueueItem {
  id?: number;
  enumerator_email: string;
  form_data: any;
  sync_status: 'pending' | 'syncing' | 'synced' | 'failed';
  created_at?: string;
  synced_at?: string;
  error_message?: string;
  retries: number;
  last_retry_at?: string;
}

export interface DashboardStats {
  total_records: number;
  records_this_month: number;
  total_enumerators: number;
  active_assignments: number;
  pending_comments: number;
  flagged_records: number;
  average_quality_score: number;
  records_by_ward: Record<string, number>;
  records_by_settlement: Record<string, number>;
  records_by_enumerator: Record<string, number>;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

// ============================================================================
// MULTI-TENANCY TYPES
// ============================================================================

export interface Project {
  id: string;
  name: string;
  description?: string;
  admin_id: string;
  admin?: {
    id: string;
    name: string;
    email: string;
    ward?: string;
    phone?: string;
  };
  created_at: string;
  updated_at: string;
}

export interface Role {
  id: number;
  name: 'admin' | 'supervisor' | 'data_collector';
  description: string;
  permissions: string[];
}

export interface EnumeratorRole {
  enumerator_id: string;
  project_id: string;
  role_id: number;
  assigned_at: string;
}

export interface FormSharing {
  form_id: string;
  enumerator_id: string;
  project_id: string;
  shared_at: string;
  shared_by_id?: string;
  permissions: string[];
}

export interface ProjectInvite {
  id: string;
  project_id: string;
  email: string;
  role_id: number;
  status: 'pending' | 'accepted' | 'rejected';
  invite_code: string;
  expires_at: string;
  created_at: string;
  accepted_at?: string;
}

export interface EnumeratorProject {
  project: Project;
  role: Role;
  permissions: string[];
}

export interface LoginResponseWithProjects {
  user: any;
  token: string;
  projects: EnumeratorProject[];
  current_project_id: string;
}
