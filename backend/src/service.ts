import { query } from './db';
import { WasteSiteRecord, ApiResponse } from './types';

export class WasteService {
  /**
   * Create a new waste site record
   */
  static async createWasteSite(data: Omit<WasteSiteRecord, 'id' | 'created_at' | 'updated_at'> & { enumerator_email?: string; image_url?: string }): Promise<WasteSiteRecord> {
    const {
      latitude,
      longitude,
      ward,
      settlement_type,
      household_size,
      waste_types,
      waste_quantity,
      waste_separation,
      disposal_method,
      distance_to_site,
      collection_frequency,
      road_access,
      distance_to_road,
      waste_near_home,
      distance_to_waste,
      impacts,
      nearby_features,
      recommended_distance,
      preferred_location,
      distance_weight,
      water_weight,
      road_weight,
      slope_weight,
      landuse_weight,
      terrain,
      flooding,
      policy_awareness,
      support_new_site,
      preferred_management,
      challenges,
      suggested_location,
      enumerator_email,
      image_url,
    } = data;

    const sql = `
      INSERT INTO waste_sites (
        latitude, longitude, geom, ward, settlement_type, household_size,
        waste_types, waste_quantity, waste_separation,
        disposal_method, distance_to_site, collection_frequency,
        road_access, distance_to_road,
        waste_near_home, distance_to_waste, impacts, nearby_features,
        recommended_distance, preferred_location,
        distance_weight, water_weight, road_weight, slope_weight, landuse_weight,
        terrain, flooding,
        policy_awareness, support_new_site, preferred_management,
        challenges, suggested_location, enumerator_email, image_url
      )
      VALUES (
        $1, $2, ST_GeomFromText('POINT(' || $1 || ' ' || $2 || ')', 4326), $3, $4, $5,
        $6, $7, $8,
        $9, $10, $11,
        $12, $13,
        $14, $15, $16, $17,
        $18, $19,
        $20, $21, $22, $23, $24,
        $25, $26,
        $27, $28, $29,
        $30, $31, $32, $33
      )
      RETURNING id, latitude, longitude, ward, settlement_type, household_size,
                waste_types, waste_quantity, waste_separation,
                disposal_method, distance_to_site, collection_frequency,
                road_access, distance_to_road,
                waste_near_home, distance_to_waste, impacts, nearby_features,
                recommended_distance, preferred_location,
                distance_weight, water_weight, road_weight, slope_weight, landuse_weight,
                terrain, flooding,
                policy_awareness, support_new_site, preferred_management,
                challenges, suggested_location, enumerator_email, image_url,
                created_at, updated_at;
    `;

    const values = [
      latitude, longitude, ward, settlement_type, household_size,
      waste_types, waste_quantity, waste_separation,
      disposal_method, distance_to_site, collection_frequency,
      road_access, distance_to_road,
      waste_near_home, distance_to_waste, impacts, nearby_features,
      recommended_distance, preferred_location,
      distance_weight, water_weight, road_weight, slope_weight, landuse_weight,
      terrain, flooding,
      policy_awareness, support_new_site, preferred_management,
      challenges, suggested_location,
      enumerator_email || null,
      image_url || null,
    ];

    const result = await query(sql, values);
    return result.rows[0];
  }

  /**
   * Get all waste site records with optional filtering
   */
  static async getAllWasteSites(limit: number = 1000, offset: number = 0): Promise<{ records: WasteSiteRecord[]; total: number }> {
    const countSql = 'SELECT COUNT(*) as count FROM waste_sites;';
    const dataSql = `
      SELECT 
        id, latitude, longitude, ward, settlement_type, household_size,
        waste_types, waste_quantity, waste_separation,
        disposal_method, distance_to_site, collection_frequency,
        road_access, distance_to_road,
        waste_near_home, distance_to_waste, impacts, nearby_features,
        recommended_distance, preferred_location,
        distance_weight, water_weight, road_weight, slope_weight, landuse_weight,
        terrain, flooding,
        policy_awareness, support_new_site, preferred_management,
        challenges, suggested_location, enumerator_email, image_url,
        created_at, updated_at
      FROM waste_sites
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2;
    `;

    const [countResult, dataResult] = await Promise.all([
      query(countSql),
      query(dataSql, [limit, offset]),
    ]);

    return {
      records: dataResult.rows,
      total: parseInt(countResult.rows[0].count, 10),
    };
  }

  /**
   * Get waste site records by enumerator email with pagination
   */
  static async getWasteSitesByEnumerator(enumeratorEmail: string, limit: number = 1000, offset: number = 0): Promise<{ records: WasteSiteRecord[]; total: number }> {
    const countSql = 'SELECT COUNT(*) as count FROM waste_sites WHERE enumerator_email = $1;';
    const dataSql = `
      SELECT 
        id, latitude, longitude, ward, settlement_type, household_size,
        waste_types, waste_quantity, waste_separation,
        disposal_method, distance_to_site, collection_frequency,
        road_access, distance_to_road,
        waste_near_home, distance_to_waste, impacts, nearby_features,
        recommended_distance, preferred_location,
        distance_weight, water_weight, road_weight, slope_weight, landuse_weight,
        terrain, flooding,
        policy_awareness, support_new_site, preferred_management,
        challenges, suggested_location, enumerator_email, image_url,
        created_at, updated_at
      FROM waste_sites
      WHERE enumerator_email = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3;
    `;

    const [countResult, dataResult] = await Promise.all([
      query(countSql, [enumeratorEmail]),
      query(dataSql, [enumeratorEmail, limit, offset]),
    ]);

    return {
      records: dataResult.rows,
      total: parseInt(countResult.rows[0].count, 10),
    };
  }

  /**
   * Get a single waste site record by ID
   */
  static async getWasteSiteById(id: string | number): Promise<WasteSiteRecord | null> {
    const sql = `
      SELECT 
        id, latitude, longitude, ward, settlement_type, household_size,
        waste_types, waste_quantity, waste_separation,
        disposal_method, distance_to_site, collection_frequency,
        road_access, distance_to_road,
        waste_near_home, distance_to_waste, impacts, nearby_features,
        recommended_distance, preferred_location,
        distance_weight, water_weight, road_weight, slope_weight, landuse_weight,
        terrain, flooding,
        policy_awareness, support_new_site, preferred_management,
        challenges, suggested_location, enumerator_email, image_url,
        created_at, updated_at
      FROM waste_sites
      WHERE id = $1;
    `;

    const result = await query(sql, [id]);
    return result.rows[0] || null;
  }

  /**
   * Get statistics summary
   */
  static async getStatistics() {
    const sql = `
      SELECT
        COUNT(*) as total_records,
        COUNT(DISTINCT ward) as total_wards,
        COUNT(DISTINCT settlement_type) as distinct_settlement_types
      FROM waste_sites;
    `;

    const result = await query(sql);
    return result.rows[0];
  }

  /**
   * Get waste sites within a geographic area (bounding box)
   */
  static async getWasteSitesByBounds(minLat: number, maxLat: number, minLng: number, maxLng: number) {
    const sql = `
      SELECT 
        id, latitude, longitude, ward, settlement_type,
        waste_types, disposal_method, impacts, enumerator_email, created_at
      FROM waste_sites
      WHERE latitude BETWEEN $1 AND $2
        AND longitude BETWEEN $3 AND $4
      ORDER BY created_at DESC;
    `;

    const result = await query(sql, [minLat, maxLat, minLng, maxLng]);
    return result.rows;
  }

  /**
   * Save a draft waste site form
   */
  static async saveDraft(enumeratorEmail: string, draftData: any): Promise<any> {
    const sql = `
      INSERT INTO waste_site_drafts (enumerator_email, draft_data)
      VALUES ($1, $2)
      ON CONFLICT (enumerator_email) DO UPDATE
      SET draft_data = EXCLUDED.draft_data, updated_at = CURRENT_TIMESTAMP
      RETURNING id, enumerator_email, draft_data, created_at, updated_at;
    `;

    const result = await query(sql, [enumeratorEmail, JSON.stringify(draftData)]);
    return result.rows[0];
  }

  /**
   * Get draft for an enumerator
   */
  static async getDraft(enumeratorEmail: string): Promise<any | null> {
    const sql = `
      SELECT id, enumerator_email, draft_data, created_at, updated_at
      FROM waste_site_drafts
      WHERE enumerator_email = $1;
    `;

    const result = await query(sql, [enumeratorEmail]);
    if (result.rows[0]) {
      return {
        ...result.rows[0],
        draft_data: typeof result.rows[0].draft_data === 'string' 
          ? JSON.parse(result.rows[0].draft_data) 
          : result.rows[0].draft_data,
      };
    }
    return null;
  }

  /**
   * Delete a draft waste site form
   */
  static async deleteDraft(enumeratorEmail: string): Promise<boolean> {
    const sql = `
      DELETE FROM waste_site_drafts
      WHERE enumerator_email = $1;
    `;

    const result = await query(sql, [enumeratorEmail]);
    return result.rowCount > 0;
  }
}
