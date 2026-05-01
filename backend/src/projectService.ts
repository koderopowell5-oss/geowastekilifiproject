/**
 * Project Service
 * Handles multi-tenancy project management, permissions, and form sharing
 */

import { pool } from './db';
import { Project, EnumeratorProject, Role, FormSharing, ProjectInvite } from './types';
import crypto from 'crypto';

export class ProjectService {
  /**
   * Create a new project
   */
  static async createProject(
    name: string,
    description: string,
    admin_id: number | string
  ): Promise<Project> {
    try {
      const result = await pool.query(
        `INSERT INTO projects (name, description, admin_id)
         VALUES ($1, $2, $3)
         RETURNING id, name, description, admin_id, created_at, updated_at`,
        [name, description, String(admin_id)]
      );
      return result.rows[0];
    } catch (error) {
      throw new Error(`Failed to create project: ${error}`);
    }
  }

  /**
   * Get all projects for an enumerator
   */
  static async getEnumeratorProjects(enumerator_id: number | string): Promise<EnumeratorProject[]> {
    try {
      const result = await pool.query(
        `SELECT 
          p.id, p.name, p.description, p.admin_id, p.created_at, p.updated_at,
          r.id as role_id, r.name as role_name, r.permissions
         FROM projects p
         JOIN enumerator_roles er ON p.id = er.project_id
         JOIN roles r ON er.role_id = r.id
         WHERE er.enumerator_id = $1
         ORDER BY p.created_at DESC`,
        [String(enumerator_id)]
      );

      return result.rows.map(row => ({
        project: {
          id: row.id,
          name: row.name,
          description: row.description,
          admin_id: row.admin_id,
          created_at: row.created_at,
          updated_at: row.updated_at,
        },
        role: {
          id: row.role_id,
          name: row.role_name,
          permissions: row.permissions,
        },
        permissions: row.permissions,
      }));
    } catch (error) {
      throw new Error(`Failed to fetch projects: ${error}`);
    }
  }

  /**
   * Get a specific project by ID
   */
  static async getProject(project_id: string): Promise<Project> {
    try {
      const result = await pool.query(
        `SELECT id, name, description, admin_id, created_at, updated_at
         FROM projects WHERE id = $1`,
        [project_id]
      );

      if (result.rows.length === 0) {
        throw new Error('Project not found');
      }

      return result.rows[0];
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
      return result.rows;
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
