/**
 * Shared TypeScript Types for GeoWaste Kilifi
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

  // Image
  image_url?: string;

  // Enumerator metadata
  enumerator_email?: string;

  // Metadata
  created_at?: string;
  updated_at?: string;
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
