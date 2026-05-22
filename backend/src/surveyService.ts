/**
 * Survey Management Service
 * Handles custom survey creation, management, and submission
 */

import pool from './db';

export interface FormField {
  id: string;
  type: 'text' | 'email' | 'number' | 'select' | 'multiselect' | 'checkbox' | 'textarea' | 'date' | 'time' | 'location' | 'image' | 'rating';
  label: string;
  name: string;
  required: boolean;
  placeholder?: string;
  hint?: string;
  options?: string[]; // For select/multiselect
  minValue?: number;
  maxValue?: number;
  validation?: {
    pattern?: string;
    minLength?: number;
    maxLength?: number;
  };
}

export interface FormSection {
  id: string;
  title: string;
  description?: string;
  fields: FormField[];
}

export interface SurveyFormConfig {
  sections: FormSection[];
  metadata?: {
    language?: string;
    allowOfflineMode?: boolean;
    allowDrafts?: boolean;
  };
}

export interface Survey {
  id: number;
  title: string;
  description?: string;
  version: string;
  created_by: string;
  organization?: string;
  is_public: boolean;
  is_default: boolean;
  form_config: SurveyFormConfig;
  total_submissions: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SurveySubmission {
  id: number;
  survey_id: number;
  latitude?: number;
  longitude?: number;
  enumerator_email?: string;
  enumerator_name?: string;
  response_data: Record<string, any>;
  is_draft: boolean;
  status: string;
  flag_reason?: string;
  created_at: string;
  updated_at: string;
}

const parseJsonField = <T>(value: any): T => {
  if (typeof value === 'string') {
    return JSON.parse(value) as T;
  }
  return value as T;
};

export class SurveyService {
  /**
   * Create a new survey
   */
  static async createSurvey(
    title: string,
    formConfig: SurveyFormConfig,
    createdBy: string,
    options?: {
      description?: string;
      organization?: string;
      isPublic?: boolean;
    }
  ): Promise<Survey> {
    try {
      const result = await pool.query(
        `INSERT INTO surveys (title, description, form_config, created_by, organization, is_public, active)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, title, description, version, created_by, organization, is_public, is_default, form_config, total_submissions, active, created_at, updated_at`,
        [
          title,
          options?.description || null,
          JSON.stringify(formConfig),
          createdBy,
          options?.organization || null,
          options?.isPublic || false,
          true,
        ]
      );

      if (result.rows.length === 0) {
        throw new Error('Failed to create survey');
      }

      const survey = result.rows[0];
      return {
        ...survey,
        form_config: parseJsonField<SurveyFormConfig>(survey.form_config),
      };
    } catch (error: any) {
      console.error('Error creating survey:', error.message);
      throw error;
    }
  }

  /**
   * Get survey by ID
   */
  static async getSurveyById(id: number): Promise<Survey | null> {
    try {
      const result = await pool.query(
        `SELECT id, title, description, version, created_by, organization, is_public, is_default, form_config, total_submissions, active, created_at, updated_at
         FROM surveys WHERE id = $1`,
        [id]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const survey = result.rows[0];
      return {
        ...survey,
        form_config: parseJsonField<SurveyFormConfig>(survey.form_config),
      };
    } catch (error: any) {
      console.error('Error fetching survey:', error.message);
      throw error;
    }
  }

  /**
   * Get all available surveys for user
   */
  static async getAvailableSurveys(email: string, includePrivate: boolean = false): Promise<Survey[]> {
    try {
      let query = `
        SELECT id, title, description, version, created_by, organization, is_public, is_default, form_config, total_submissions, active, created_at, updated_at
        FROM surveys
        WHERE active = true
      `;

      if (!includePrivate) {
        query += ` AND (is_public = true OR created_by = $1)`;
      } else {
        query += ` AND created_by = $1`;
      }

      query += ` ORDER BY is_default DESC, created_at DESC`;

      const result = await pool.query(query, [email]);

      return result.rows.map((survey: any) => ({
        ...survey,
        form_config: parseJsonField<SurveyFormConfig>(survey.form_config),
      }));
    } catch (error: any) {
      console.error('Error fetching surveys:', error.message);
      throw error;
    }
  }

  /**
   * Get default survey
   */
  static async getDefaultSurvey(): Promise<Survey | null> {
    try {
      const result = await pool.query(
        `SELECT id, title, description, version, created_by, organization, is_public, is_default, form_config, total_submissions, active, created_at, updated_at
         FROM surveys WHERE is_default = true AND active = true LIMIT 1`
      );

      if (result.rows.length === 0) {
        return null;
      }

      const survey = result.rows[0];
      return {
        ...survey,
        form_config: parseJsonField<SurveyFormConfig>(survey.form_config),
      };
    } catch (error: any) {
      console.error('Error fetching default survey:', error.message);
      throw error;
    }
  }

  /**
   * Update survey
   */
  static async updateSurvey(
    id: number,
    updates: Partial<Survey>
  ): Promise<Survey> {
    try {
      const fields: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      if (updates.title) {
        fields.push(`title = $${paramCount++}`);
        values.push(updates.title);
      }
      if (updates.description !== undefined) {
        fields.push(`description = $${paramCount++}`);
        values.push(updates.description);
      }
      if (updates.form_config) {
        fields.push(`form_config = $${paramCount++}`);
        values.push(JSON.stringify(updates.form_config));
      }
      if (updates.active !== undefined) {
        fields.push(`active = $${paramCount++}`);
        values.push(updates.active);
      }

      fields.push(`updated_at = NOW()`);
      values.push(id);

      const result = await pool.query(
        `UPDATE surveys SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING id, title, description, version, created_by, organization, is_public, is_default, form_config, total_submissions, active, created_at, updated_at`,
        values
      );

      if (result.rows.length === 0) {
        throw new Error('Survey not found');
      }

      const survey = result.rows[0];
      return {
        ...survey,
        form_config: parseJsonField<SurveyFormConfig>(survey.form_config),
      };
    } catch (error: any) {
      console.error('Error updating survey:', error.message);
      throw error;
    }
  }

  /**
   * Delete survey
   */
  static async deleteSurvey(id: number): Promise<boolean> {
    try {
      const result = await pool.query(
        `DELETE FROM surveys WHERE id = $1 RETURNING id`,
        [id]
      );

      return result.rows.length > 0;
    } catch (error: any) {
      console.error('Error deleting survey:', error.message);
      throw error;
    }
  }

  /**
   * Submit survey response
   */
  static async submitSurveyResponse(
    surveyId: number,
    responseData: Record<string, any>,
    options?: {
      latitude?: number;
      longitude?: number;
      enumeratorEmail?: string;
      enumeratorName?: string;
      isDraft?: boolean;
      projectId?: string | null;
    }
  ): Promise<SurveySubmission> {
    try {
      // Ensure project context is stored with the response data (server-sourced)
      const storedResponse = {
        ...responseData,
        _project_id: options?.projectId || null,
      };

      const hasLocation = options?.latitude != null && options?.longitude != null;
      const geomExpression = hasLocation
        ? 'ST_SetSRID(ST_MakePoint($3::double precision, $2::double precision), 4326)'
        : 'NULL';

      const result = await pool.query(
        `INSERT INTO survey_submissions (survey_id, latitude, longitude, geom, enumerator_email, enumerator_name, response_data, is_draft, status, project_id)
         VALUES ($1, $2::numeric, $3::numeric, ${geomExpression}, $4, $5, $6, $7, $8, $9)
         RETURNING id, survey_id, latitude, longitude, enumerator_email, enumerator_name, response_data, is_draft, status, flag_reason, project_id, created_at, updated_at`,
        [
          surveyId,
          options?.latitude ?? null,
          options?.longitude ?? null,
          options?.enumeratorEmail || null,
          options?.enumeratorName || null,
          JSON.stringify(storedResponse),
          options?.isDraft || false,
          options?.isDraft ? 'draft' : 'submitted',
          options?.projectId || null,
        ]
      );

      if (result.rows.length === 0) {
        throw new Error('Failed to submit survey response');
      }

      const submission = result.rows[0];
      return {
        ...submission,
        project_id: submission.project_id || null,
        response_data: parseJsonField<Record<string, any>>(submission.response_data),
      };
    } catch (error: any) {
      console.error('Error submitting survey response:', error.message);
      throw error;
    }
  }

  /**
   * Get survey submissions
   */
  static async getSurveySubmissions(
    surveyId: number,
    filters?: { status?: string; enumeratorEmail?: string; projectId?: string }
  ): Promise<SurveySubmission[]> {
    try {
      let query = `
        SELECT id, survey_id, latitude, longitude, enumerator_email, enumerator_name, response_data, is_draft, status, flag_reason, project_id, created_at, updated_at
        FROM survey_submissions
        WHERE survey_id = $1
      `;

      const values: any[] = [surveyId];
      let paramCount = 2;

      if (filters?.status) {
        query += ` AND status = $${paramCount++}`;
        values.push(filters.status);
      }

      if (filters?.enumeratorEmail) {
        query += ` AND enumerator_email = $${paramCount++}`;
        values.push(filters.enumeratorEmail);
      }

      if (filters?.projectId) {
        query += ` AND project_id = $${paramCount++}`;
        values.push(filters.projectId);
      }

      query += ` ORDER BY created_at DESC`;

      const result = await pool.query(query, values);

      return result.rows.map((submission: any) => ({
        ...submission,
        project_id: submission.project_id || null,
        response_data: parseJsonField<Record<string, any>>(submission.response_data),
      }));
    } catch (error: any) {
      console.error('Error fetching submissions:', error.message);
      throw error;
    }
  }

  /**
   * Create survey version
   */
  static async createSurveyVersion(
    surveyId: number,
    formConfig: SurveyFormConfig,
    createdBy: string,
    changeDescription?: string
  ): Promise<any> {
    try {
      // Get current survey version
      const surveyResult = await pool.query(
        `SELECT version FROM surveys WHERE id = $1`,
        [surveyId]
      );

      if (surveyResult.rows.length === 0) {
        throw new Error('Survey not found');
      }

      const currentVersion = surveyResult.rows[0].version;
      const newVersion = this.incrementVersion(currentVersion);

      // Create version entry
      const result = await pool.query(
        `INSERT INTO survey_versions (survey_id, version_number, form_config, change_description, created_by)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, survey_id, version_number, form_config, change_description, created_by, created_at`,
        [surveyId, newVersion, JSON.stringify(formConfig), changeDescription || null, createdBy]
      );

      // Update survey version
      await pool.query(
        `UPDATE surveys SET version = $1, form_config = $2, updated_at = NOW() WHERE id = $3`,
        [newVersion, JSON.stringify(formConfig), surveyId]
      );

      return result.rows[0];
    } catch (error: any) {
      console.error('Error creating survey version:', error.message);
      throw error;
    }
  }

  /**
   * Export survey as JSON
   */
  static exportSurveyToJSON(survey: Survey): string {
    return JSON.stringify(
      {
        survey: {
          title: survey.title,
          description: survey.description,
          version: survey.version,
          organization: survey.organization,
          formConfig: survey.form_config,
        },
        exportedAt: new Date().toISOString(),
        exportVersion: '1.0',
      },
      null,
      2
    );
  }

  /**
   * Import survey from JSON
   */
  static async importSurveyFromJSON(
    jsonData: string,
    createdBy: string
  ): Promise<Survey> {
    try {
      const parsed = JSON.parse(jsonData);
      const { survey } = parsed;

      if (!survey || !survey.title || !survey.formConfig) {
        throw new Error('Invalid survey JSON format');
      }

      return await this.createSurvey(
        survey.title,
        survey.formConfig,
        createdBy,
        {
          description: survey.description,
          organization: survey.organization,
        }
      );
    } catch (error: any) {
      console.error('Error importing survey:', error.message);
      throw new Error(`Failed to import survey: ${error.message}`);
    }
  }

  /**
   * Helper: Increment version
   */
  private static incrementVersion(version: string): string {
    const parts = version.split('.');
    const patch = parseInt(parts[parts.length - 1], 10);
    parts[parts.length - 1] = (patch + 1).toString();
    return parts.join('.');
  }

  /**
   * Get survey templates
   */
  static async getSurveyTemplates(): Promise<any[]> {
    try {
      const result = await pool.query(
        `SELECT id, name, description, category, form_config, created_at FROM survey_templates ORDER BY category, name`
      );

      return result.rows.map((template: any) => ({
        ...template,
        form_config: parseJsonField<SurveyFormConfig>(template.form_config),
      }));
    } catch (error: any) {
      console.error('Error fetching templates:', error.message);
      throw error;
    }
  }

  /**
   * Create survey from template
   */
  static async createSurveyFromTemplate(
    templateId: number,
    title: string,
    createdBy: string,
    options?: { description?: string; organization?: string }
  ): Promise<Survey> {
    try {
      const result = await pool.query(
        `SELECT form_config FROM survey_templates WHERE id = $1`,
        [templateId]
      );

      if (result.rows.length === 0) {
        throw new Error('Template not found');
      }

      const formConfig = parseJsonField<SurveyFormConfig>(result.rows[0].form_config);
      return await this.createSurvey(title, formConfig, createdBy, options);
    } catch (error: any) {
      console.error('Error creating survey from template:', error.message);
      throw error;
    }
  }
}

export const surveyService = new SurveyService();
