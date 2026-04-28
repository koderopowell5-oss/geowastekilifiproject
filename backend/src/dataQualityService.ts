/**
 * Data Quality Scoring Service
 * Calculates and tracks data quality of waste site records
 */

import { WasteSiteRecord } from './types';

export class DataQualityService {
  /**
   * Calculate quality score for a waste site record (0-100)
   * Checks for: completeness, data validity, geographic accuracy, image presence
   */
  calculateQualityScore(record: WasteSiteRecord): { score: number; issues: string[] } {
    let score = 100;
    const issues: string[] = [];

    // 1. Check completeness (30 points max deduction)
    const requiredFields = [
      'latitude', 'longitude', 'ward', 'settlement_type', 'household_size',
      'waste_types', 'waste_quantity', 'disposal_method', 'collection_frequency',
      'road_access', 'terrain', 'flooding'
    ];

    let emptyFieldCount = 0;
    requiredFields.forEach(field => {
      const value = (record as any)[field];
      if (value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) {
        emptyFieldCount++;
        issues.push(`Missing required field: ${field}`);
      }
    });

    const completenessScore = (requiredFields.length - emptyFieldCount) / requiredFields.length;
    score -= (1 - completenessScore) * 30;

    // 2. Check geographic validity (15 points max deduction)
    if (!this.isValidCoordinate(record.latitude, record.longitude)) {
      score -= 15;
      issues.push('Invalid GPS coordinates');
    }

    // 3. Check waste types validity (10 points max deduction)
    const validWasteTypes = ['Organic', 'Plastics', 'Glass', 'Metal', 'Hazardous', 'Liquid'];
    if (record.waste_types && !record.waste_types.every(t => validWasteTypes.includes(t))) {
      score -= 5;
      issues.push('Invalid waste type values');
    }

    // 4. Check disposal method validity (10 points max deduction)
    const validMethods = ['County collection', 'Private collector', 'Open dumping', 'Burning', 'Burying', 'Drainage disposal'];
    if (record.disposal_method && !validMethods.includes(record.disposal_method)) {
      score -= 5;
      issues.push('Invalid disposal method');
    }

    // 5. Image presence (15 points bonus if present, 5 point deduction if missing)
    if (record.image_url) {
      score = Math.min(100, score + 0); // Image is bonus for records that already score high
    } else {
      score -= 5;
      issues.push('No image attached');
    }

    // 6. Check for suspicious patterns (10 points max deduction)
    if (this.hasSuspiciousPatterns(record)) {
      score -= 10;
      issues.push('Data contains suspicious patterns - manual review recommended');
    }

    // 7. Text field quality (10 points max deduction)
    if (record.challenges && record.challenges.length < 5) {
      score -= 3;
      issues.push('Challenges field too short');
    }

    // Ensure score is between 0-100
    score = Math.max(0, Math.min(100, score));

    return { score: Math.round(score), issues };
  }

  /**
   * Validate geographic coordinates
   * Kilifi coordinates: roughly 3°S 40°E
   */
  private isValidCoordinate(lat: number, lng: number): boolean {
    // Kilifi bounds with buffer
    const minLat = -4.0;
    const maxLat = -2.5;
    const minLng = 38.5;
    const maxLng = 40.5;

    return lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng;
  }

  /**
   * Detect suspicious patterns in data
   */
  private hasSuspiciousPatterns(record: WasteSiteRecord): boolean {
    let suspiciousCount = 0;

    // All weights are the same (laziness pattern)
    if (record.distance_weight === record.water_weight && 
        record.water_weight === record.road_weight &&
        record.road_weight === record.slope_weight &&
        record.slope_weight === record.landuse_weight) {
      suspiciousCount++;
    }

    // All impacts selected (unrealistic)
    if (record.impacts && record.impacts.length >= 4) {
      suspiciousCount++;
    }

    // Too many preferred locations
    if (record.preferred_location && record.preferred_location.length > 4) {
      suspiciousCount++;
    }

    // Contradictory data: waste near home but disposal method is county collection (distance issue)
    if (record.waste_near_home && record.disposal_method === 'County collection' && record.distance_to_site === '<100m') {
      suspiciousCount++;
    }

    return suspiciousCount >= 2;
  }

  /**
   * Determine if record should be flagged for review
   */
  shouldFlag(score: number, issues: string[]): boolean {
    // Flag if score is too low
    if (score < 60) return true;

    // Flag if critical issues exist
    const criticalIssues = [
      'Invalid GPS coordinates',
      'Missing required field',
      'Data contains suspicious patterns',
    ];

    return issues.some(issue => criticalIssues.some(critical => issue.includes(critical)));
  }

  /**
   * Get quality level description
   */
  getQualityLevel(score: number): 'excellent' | 'good' | 'fair' | 'poor' {
    if (score >= 85) return 'excellent';
    if (score >= 70) return 'good';
    if (score >= 50) return 'fair';
    return 'poor';
  }

  /**
   * Get quality level color (for UI)
   */
  getQualityColor(score: number): string {
    const level = this.getQualityLevel(score);
    switch (level) {
      case 'excellent': return '#56C596'; // Green
      case 'good': return '#329D9C'; // Teal
      case 'fair': return '#F59E0B'; // Amber
      case 'poor': return '#EF4444'; // Red
    }
  }
}

export const dataQualityService = new DataQualityService();
