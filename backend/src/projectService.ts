/**
 * Project Service
 * Handles multi-tenancy project management, permissions, and form sharing
 */

import { pool } from './db';
import { Project, EnumeratorProject, Role, FormSharing, ProjectInvite } from './types';
import crypto from 'crypto';

const parseJsonField = <T>(value: any): T => {
  if (typeof value === 'string') {
    return JSON.parse(value) as T;
  }
  return value as T;
};

export class ProjectService {
  /**
   * Create a new project
   */
  static async createProject(
    name: string,
    description: string,
    admin_id: number | string
  ): Promise<Project> {
    const baseName = name.trim() || 'New Project';
    let projectName = baseName;
    let attempts = 0;

    while (true) {
      try {
        const result = await pool.query(
          `INSERT INTO projects (name, description, admin_id)
           VALUES ($1, $2, $3)
           RETURNING id, name, description, admin_id, created_at, updated_at`,
          [projectName, description, String(admin_id)]
        );
        return result.rows[0];
      } catch (error: any) {
        const isDuplicateNameError = error?.code === '23505' && error?.constraint === 'projects_name_key';
        if (!isDuplicateNameError) {
          throw new Error(`Failed to create project: ${error.message || error}`);
        }

        attempts += 1;
        if (attempts >= 5) {
          throw new Error(`Failed to create project: project name '${baseName}' is already in use`);
        }

        projectName = `${baseName} (${Math.floor(Math.random() * 9000) + 1000})`;
      }
    }
  }

  /**
   * Get all projects for an enumerator
   */
  static async getEnumeratorProjects(enumerator_id: number | string): Promise<EnumeratorProject[]> {
    try {
      const defaultAdminPermissions = [
        'submit_data',
        'view_submissions',
        'view_aggregate',
        'edit_forms',
        'manage_team',
        'share_forms',
        'delete_submissions',
      ];

      const result = await pool.query(
        `SELECT 
          p.id, p.name, p.description, p.admin_id, p.created_at, p.updated_at,
          a.id as admin_user_id, a.name as admin_name, a.email as admin_email, a.ward as admin_ward, a.phone as admin_phone,
          r.id as role_id, r.name as role_name, r.permissions
         FROM projects p
         LEFT JOIN enumerator_roles er ON p.id = er.project_id AND er.enumerator_id = $1
         LEFT JOIN roles r ON er.role_id = r.id
         LEFT JOIN enumerators a ON p.admin_id = a.id
         WHERE p.admin_id = $1 OR er.enumerator_id = $1
         ORDER BY p.created_at DESC`,
        [String(enumerator_id)]
      );

      return result.rows.map(row => {
        const isProjectOwner = String(row.admin_id) === String(enumerator_id);
        const permissions = row.permissions ?? (isProjectOwner ? defaultAdminPermissions : []);

        return {
          project: {
            id: row.id,
            name: row.name,
            description: row.description,
            admin_id: row.admin_id,
            admin: row.admin_user_id
              ? {
                  id: row.admin_user_id,
                  name: row.admin_name,
                  email: row.admin_email,
                  ward: row.admin_ward,
                  phone: row.admin_phone,
                }
              : undefined,
            created_at: row.created_at,
            updated_at: row.updated_at,
          },
          role: {
            id: row.role_id || 1,
            name: row.role_name || 'admin',
            permissions,
          },
          permissions,
        };
      });
    } catch (error) {
      throw new Error(`Failed to fetch projects: ${error}`);
    }
  }

  /**
   * Get all projects with linked admin info
   */
  static async getAllProjectsWithAdmin(): Promise<Project[]> {
    try {
      const result = await pool.query(
        `SELECT 
          p.id, p.name, p.description, p.admin_id, p.created_at, p.updated_at,
          a.id as admin_user_id, a.name as admin_name, a.email as admin_email, a.ward as admin_ward, a.phone as admin_phone
         FROM projects p
         LEFT JOIN enumerators a ON p.admin_id = a.id
         ORDER BY p.created_at DESC`
      );

      return result.rows.map(row => ({
        id: row.id,
        name: row.name,
        description: row.description,
        admin_id: row.admin_id,
        admin: row.admin_user_id
          ? {
              id: row.admin_user_id,
              name: row.admin_name,
              email: row.admin_email,
              ward: row.admin_ward,
              phone: row.admin_phone,
            }
          : undefined,
        created_at: row.created_at,
        updated_at: row.updated_at,
      }));
    } catch (error) {
      throw new Error(`Failed to fetch all projects: ${error}`);
    }
  }

  /**
   * Get a specific project by ID
   */
  static async getProject(project_id: string): Promise<Project> {
    try {
      const result = await pool.query(
        `SELECT 
          p.id, p.name, p.description, p.admin_id, p.created_at, p.updated_at,
          a.id as admin_user_id, a.name as admin_name, a.email as admin_email, a.ward as admin_ward, a.phone as admin_phone
         FROM projects p
         LEFT JOIN enumerators a ON p.admin_id = a.id
         WHERE p.id = $1`,
        [project_id]
      );

      if (result.rows.length === 0) {
        throw new Error('Project not found');
      }

      const row = result.rows[0];

      return {
        id: row.id,
        name: row.name,
        description: row.description,
        admin_id: row.admin_id,
        admin: row.admin_user_id
          ? {
              id: row.admin_user_id,
              name: row.admin_name,
              email: row.admin_email,
              ward: row.admin_ward,
              phone: row.admin_phone,
            }
          : undefined,
        created_at: row.created_at,
        updated_at: row.updated_at,
      };
    } catch (error) {
      throw new Error(`Failed to fetch project: ${error}`);
    }
  }

  /**
   * Grant enumerator access to a project
   */
  static async grantProjectAccess(
    enumerator_id: number | string,
    project_id: string,
    role_id: number
  ): Promise<void> {
    try {
      await pool.query(
        `INSERT INTO enumerator_roles (enumerator_id, project_id, role_id)
         VALUES ($1, $2, $3)
         ON CONFLICT (enumerator_id, project_id, role_id) DO NOTHING`,
        [String(enumerator_id), project_id, role_id]
      );
    } catch (error) {
      throw new Error(`Failed to grant project access: ${error}`);
    }
  }

  /**
   * Check if enumerator has access to project
   */
  static async hasProjectAccess(
    enumerator_id: number | string,
    project_id: string
  ): Promise<boolean> {
    try {
      const result = await pool.query(
        `SELECT 1 FROM enumerator_roles
         WHERE enumerator_id = $1 AND project_id = $2`,
        [String(enumerator_id), project_id]
      );
      return result.rows.length > 0;
    } catch (error) {
      throw new Error(`Failed to check project access: ${error}`);
    }
  }

  /**
   * Check if enumerator has specific permission in project
   */
  static async hasPermission(
    enumerator_id: number | string,
    project_id: string,
    permission: string
  ): Promise<boolean> {
    try {
      const result = await pool.query(
        `SELECT r.permissions FROM enumerator_roles er
         JOIN roles r ON er.role_id = r.id
         WHERE er.enumerator_id = $1 AND er.project_id = $2
         LIMIT 1`,
        [String(enumerator_id), project_id]
      );

      if (result.rows.length === 0) {
        return false;
      }

      const permissions = result.rows[0].permissions;
      return Array.isArray(permissions) && permissions.includes(permission);
    } catch (error) {
      throw new Error(`Failed to check permission: ${error}`);
    }
  }

  /**
   * Get all enumerators in a project
   */
  static async getProjectEnumerators(project_id: string): Promise<any[]> {
    try {
      const result = await pool.query(
        `SELECT DISTINCT e.id, e.email, e.name,
          r.id as role_id, r.name as role_name, r.permissions
         FROM enumerators e
         JOIN enumerator_roles er ON e.id = er.enumerator_id
         JOIN roles r ON er.role_id = r.id
         WHERE er.project_id = $1
         ORDER BY e.name ASC`,
        [project_id]
      );
      return result.rows;
    } catch (error) {
      throw new Error(`Failed to fetch project enumerators: ${error}`);
    }
  }

  /**
   * Publish a form to all enumerators in a project
   */
  static async publishFormToProject(
    form_id: string,
    project_id: string,
    shared_by_id: number | string
  ): Promise<FormSharing[]> {
    try {
      const enumerators = await this.getProjectEnumerators(project_id);
      const sharedForms: FormSharing[] = [];

      for (const enumerator of enumerators) {
        const shared = await this.shareFormWithEnumerator(
          form_id,
          enumerator.id,
          project_id,
          shared_by_id
        );
        sharedForms.push(shared);
      }

      return sharedForms;
    } catch (error) {
      throw new Error(`Failed to publish form to project: ${error}`);
    }
  }

  /**
   * Share a form with an enumerator
   */
  static async shareFormWithEnumerator(
    form_id: string,
    enumerator_id: number | string,
    project_id: string,
    shared_by_id: number | string
  ): Promise<FormSharing> {
    try {
      await pool.query(
        `INSERT INTO form_sharing (form_id, enumerator_id, project_id, shared_by_id)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (form_id, enumerator_id) DO UPDATE SET
           shared_at = CURRENT_TIMESTAMP,
           shared_by_id = $4`,
        [form_id, String(enumerator_id), project_id, String(shared_by_id)]
      );

      return {
        form_id,
        enumerator_id: String(enumerator_id),
        project_id,
        shared_at: new Date().toISOString(),
        shared_by_id: String(shared_by_id),
        permissions: ['download', 'submit'],
      };
    } catch (error) {
      throw new Error(`Failed to share form: ${error}`);
    }
  }

  /**
   * Get all forms shared with an enumerator
   */
  static async getSharedForms(
    enumerator_id: number | string,
    project_id: string
  ): Promise<any[]> {
    try {
      const result = await pool.query(
        `SELECT s.id, s.title, s.description, s.form_config,
          fs.shared_at, fs.permissions
         FROM form_sharing fs
         JOIN surveys s ON fs.form_id = s.id
         WHERE fs.enumerator_id = $1 AND fs.project_id = $2
         ORDER BY fs.shared_at DESC`,
        [String(enumerator_id), project_id]
      );
      return result.rows.map((row: any) => ({
        ...row,
        form_config: parseJsonField(row.form_config),
      }));
    } catch (error) {
      throw new Error(`Failed to fetch shared forms: ${error}`);
    }
  }

  /**
   * Create a project invitation
   */
  static async createProjectInvite(
    project_id: string,
    email: string,
    role_id: number
  ): Promise<ProjectInvite> {
    try {
      const invite_code = crypto.randomBytes(32).toString('hex');

      const result = await pool.query(
        `INSERT INTO project_invites (project_id, email, role_id, invite_code, status)
         VALUES ($1, $2, $3, $4, 'pending')
         ON CONFLICT (project_id, email) DO UPDATE SET
           role_id = $3,
           status = 'pending',
           invite_code = $4,
           expires_at = CURRENT_TIMESTAMP + INTERVAL '7 days'
         RETURNING id, project_id, email, role_id, status, invite_code, expires_at, created_at`,
        [project_id, email, role_id, invite_code]
      );

      return result.rows[0];
    } catch (error) {
      throw new Error(`Failed to create project invite: ${error}`);
    }
  }

  /**
   * Verify and accept a project invitation
   */
  static async acceptProjectInvite(
    invite_code: string,
    enumerator_id: number | string
  ): Promise<ProjectInvite> {
    try {
      // Get the invite
      const inviteResult = await pool.query(
        `SELECT id, project_id, email, role_id, status, expires_at
         FROM project_invites
         WHERE invite_code = $1 AND status = 'pending'`,
        [invite_code]
      );

      if (inviteResult.rows.length === 0) {
        throw new Error('Invalid or expired invitation');
      }

      const invite = inviteResult.rows[0];

      // Check if expired
      if (new Date(invite.expires_at) < new Date()) {
        throw new Error('Invitation has expired');
      }

      // Accept the invite
      await pool.query(
        `UPDATE project_invites
         SET status = 'accepted', accepted_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [invite.id]
      );

      // Grant access to the project
      await this.grantProjectAccess(enumerator_id, invite.project_id, invite.role_id);

      return {
        ...invite,
        accepted_at: new Date().toISOString(),
      };
    } catch (error) {
      throw new Error(`Failed to accept project invite: ${error}`);
    }
  }

  /**
   * Get pending invitations for an email
   */
  static async getPendingInvitations(email: string): Promise<ProjectInvite[]> {
    try {
      const result = await pool.query(
        `SELECT id, project_id, email, role_id, status, invite_code, expires_at, created_at
         FROM project_invites
         WHERE email = $1 AND status = 'pending' AND expires_at > CURRENT_TIMESTAMP
         ORDER BY created_at DESC`,
        [email]
      );
      return result.rows;
    } catch (error) {
      throw new Error(`Failed to fetch pending invitations: ${error}`);
    }
  }

  /**
   * Set default project for enumerator
   */
  static async setDefaultProject(
    enumerator_id: number | string,
    project_id: string
  ): Promise<void> {
    try {
      await pool.query(
        `UPDATE enumerators SET primary_project_id = $1 WHERE id = $2`,
        [project_id, String(enumerator_id)]
      );
    } catch (error) {
      throw new Error(`Failed to set default project: ${error}`);
    }
  }

  /**
   * Get roles for dropdown/selection
   */
  static async getAllRoles(): Promise<Role[]> {
    try {
      const result = await pool.query(`SELECT * FROM roles ORDER BY id ASC`);
      return result.rows;
    } catch (error) {
      throw new Error(`Failed to fetch roles: ${error}`);
    }
  }
}
