import { Router, Request, Response } from 'express';
import multer from 'multer';
import { WasteService } from './service';
import { AuthService } from './authService';
import { cloudinaryUploadService } from './cloudinaryService';
import { emailService } from './emailService';
import { ApiResponse, WasteSiteRecord, RecordComment, EnumeratorAssignment } from './types';
import { authMiddleware, requireAdmin, requireSupervisor, AuthRequest } from './middleware';
import { pool } from './db';

const router = Router();

// Configure multer for file uploads
const storage = multer.memoryStorage(); // Store files in memory
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'image') {
      if (['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid image format'));
      }
    } else {
      cb(null, true);
    }
  },
});

/**
 * POST /api/auth/signup
 * Register a new enumerator
 */
router.post('/auth/signup', async (req: Request, res: Response) => {
  try {
    const { email, password, name, ward, phone } = req.body;

    // Validate required fields
    if (!email || !password || !name || !ward || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        error: 'email, password, name, ward, and phone are required',
      } as ApiResponse);
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format',
      } as ApiResponse);
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters',
      } as ApiResponse);
    }

    const enumerator = await AuthService.registerEnumerator({
      email,
      password,
      name,
      ward,
      phone,
    });

    return res.status(201).json({
      success: true,
      message: 'Enumerator registered successfully',
      data: enumerator,
    } as ApiResponse);
  } catch (error: any) {
    console.error('Error registering enumerator:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Registration failed',
      error: error.message,
    } as ApiResponse);
  }
});

/**
 * POST /api/auth/login
 * Authenticate an enumerator
 */
router.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        error: 'email and password are required',
      } as ApiResponse);
    }

    const enumerator = await AuthService.authenticateEnumerator(email, password);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: enumerator,
    } as ApiResponse);
  } catch (error: any) {
    console.error('Error authenticating enumerator:', error);
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials',
      error: error.message,
    } as ApiResponse);
  }
});

/**
 * GET /api/auth/enumerators
 * Get all enumerators
 */
router.get('/auth/enumerators', async (req: Request, res: Response) => {
  try {
    const enumerators = await AuthService.getAllEnumerators();

    return res.status(200).json({
      success: true,
      message: 'Enumerators retrieved successfully',
      data: enumerators,
    } as ApiResponse);
  } catch (error: any) {
    console.error('Error retrieving enumerators:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    } as ApiResponse);
  }
});

/**
 * DELETE /api/auth/enumerators/:id
 * Delete an enumerator by ID
 */
router.delete('/auth/enumerators/:id', authMiddleware, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(Number(id))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid enumerator ID',
        error: 'ID must be a valid number',
      } as ApiResponse);
    }

    const deleted = await AuthService.deleteEnumerator(Number(id));

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Enumerator not found',
      } as ApiResponse);
    }

    return res.status(200).json({
      success: true,
      message: 'Enumerator deleted successfully',
    } as ApiResponse);
  } catch (error: any) {
    console.error('Error deleting enumerator:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    } as ApiResponse);
  }
});

/**
 * POST /api/waste
 * Create a new waste site record
 */
router.post('/waste', async (req: Request, res: Response) => {
  try {
    const data = req.body;

    // Basic validation
    if (
      !data.latitude ||
      !data.longitude ||
      !data.ward ||
      !data.settlement_type ||
      !data.household_size
    ) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        error: 'latitude, longitude, ward, settlement_type, and household_size are required',
      } as ApiResponse);
    }

    // Pass enumerator_email if provided
    const recordData = {
      ...data,
      enumerator_email: data.enumerator_email || null,
    };

    const record = await WasteService.createWasteSite(recordData);

    return res.status(201).json({
      success: true,
      message: 'Waste site record created successfully',
      data: record,
    } as ApiResponse<WasteSiteRecord>);
  } catch (error: any) {
    console.error('Error creating waste site:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    } as ApiResponse);
  }
});

/**
 * GET /api/waste
 * Retrieve waste site records with pagination
 * Optional: filter by enumerator_email
 */
router.get('/waste', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 1000;
    const offset = parseInt(req.query.offset as string) || 0;
    const enumeratorEmail = req.query.enumerator_email as string | undefined;

    let records: any[];
    let total: number;

    if (enumeratorEmail) {
      // Filter by enumerator email
      const result = await WasteService.getWasteSitesByEnumerator(enumeratorEmail, limit, offset);
      records = result.records;
      total = result.total;
    } else {
      // Get all waste sites
      const result = await WasteService.getAllWasteSites(limit, offset);
      records = result.records;
      total = result.total;
    }

    return res.status(200).json({
      success: true,
      message: 'Waste sites retrieved successfully',
      data: {
        records,
        total,
        pages: Math.ceil(total / limit),
      },
    } as ApiResponse);
  } catch (error: any) {
    console.error('Error retrieving waste sites:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    } as ApiResponse);
  }
});

/**
 * GET /api/waste/:id
 * Retrieve a single waste site record by ID
 */
router.get('/waste/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(Number(id))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID parameter',
        error: 'ID must be a valid number',
      } as ApiResponse);
    }

    const record = await WasteService.getWasteSiteById(id);

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Waste site record not found',
      } as ApiResponse);
    }

    return res.status(200).json({
      success: true,
      message: 'Waste site record retrieved successfully',
      data: record,
    } as ApiResponse<WasteSiteRecord>);
  } catch (error: any) {
    console.error('Error retrieving waste site:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    } as ApiResponse);
  }
});

/**
 * DELETE /api/waste/:id
 * Delete a waste site record by ID (admin only)
 */
router.delete('/waste/:id', authMiddleware, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(Number(id))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID parameter',
        error: 'ID must be a valid number',
      } as ApiResponse);
    }

    const deleted = await WasteService.deleteWasteSite(Number(id));

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Waste site record not found',
      } as ApiResponse);
    }

    return res.status(200).json({
      success: true,
      message: 'Waste site record deleted successfully',
    } as ApiResponse);
  } catch (error: any) {
    console.error('Error deleting waste site:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    } as ApiResponse);
  }
});

/**
 * GET /api/waste/stats/summary
 * Get statistics summary
 */
router.get('/waste/stats/summary', async (req: Request, res: Response) => {
  try {
    const stats = await WasteService.getStatistics();

    return res.status(200).json({
      success: true,
      message: 'Statistics retrieved successfully',
      data: stats,
    } as ApiResponse);
  } catch (error: any) {
    console.error('Error retrieving statistics:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    } as ApiResponse);
  }
});

/**
 * GET /api/waste/bounds
 * Get waste sites within geographic bounds
 */
router.get('/bounds/:minLat/:maxLat/:minLng/:maxLng', async (req: Request, res: Response) => {
  try {
    const { minLat, maxLat, minLng, maxLng } = req.params;

    const minLatNum = parseFloat(minLat);
    const maxLatNum = parseFloat(maxLat);
    const minLngNum = parseFloat(minLng);
    const maxLngNum = parseFloat(maxLng);

    if (isNaN(minLatNum) || isNaN(maxLatNum) || isNaN(minLngNum) || isNaN(maxLngNum)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coordinates',
      } as ApiResponse);
    }

    const records = await WasteService.getWasteSitesByBounds(minLatNum, maxLatNum, minLngNum, maxLngNum);

    return res.status(200).json({
      success: true,
      message: 'Waste sites within bounds retrieved successfully',
      data: records,
    } as ApiResponse);
  } catch (error: any) {
    console.error('Error retrieving waste sites by bounds:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    } as ApiResponse);
  }
});

/**
 * POST /api/drafts
 * Save a draft waste site form
 */
router.post('/drafts', async (req: Request, res: Response) => {
  try {
    const { enumerator_email, draft_data } = req.body;

    if (!enumerator_email || !draft_data) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        error: 'enumerator_email and draft_data are required',
      } as ApiResponse);
    }

    const draft = await WasteService.saveDraft(enumerator_email, draft_data);

    return res.status(201).json({
      success: true,
      message: 'Draft saved successfully',
      data: draft,
    } as ApiResponse);
  } catch (error: any) {
    console.error('Error saving draft:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    } as ApiResponse);
  }
});

/**
 * GET /api/drafts/:enumerator_email
 * Get draft for an enumerator
 */
router.get('/drafts/:enumerator_email', async (req: Request, res: Response) => {
  try {
    const { enumerator_email } = req.params;

    if (!enumerator_email) {
      return res.status(400).json({
        success: false,
        message: 'Missing required field',
        error: 'enumerator_email is required',
      } as ApiResponse);
    }

    const draft = await WasteService.getDraft(enumerator_email);

    if (!draft) {
      return res.status(404).json({
        success: false,
        message: 'No draft found for this enumerator',
      } as ApiResponse);
    }

    return res.status(200).json({
      success: true,
      message: 'Draft retrieved successfully',
      data: draft,
    } as ApiResponse);
  } catch (error: any) {
    console.error('Error retrieving draft:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    } as ApiResponse);
  }
});

/**
 * DELETE /api/drafts/:enumerator_email
 * Delete a draft waste site form
 */
router.delete('/drafts/:enumerator_email', async (req: Request, res: Response) => {
  try {
    const { enumerator_email } = req.params;

    if (!enumerator_email) {
      return res.status(400).json({
        success: false,
        message: 'Missing required field',
        error: 'enumerator_email is required',
      } as ApiResponse);
    }

    const deleted = await WasteService.deleteDraft(enumerator_email);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'No draft found for this enumerator',
      } as ApiResponse);
    }

    return res.status(200).json({
      success: true,
      message: 'Draft deleted successfully',
    } as ApiResponse);
  } catch (error: any) {
    console.error('Error deleting draft:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    } as ApiResponse);
  }
});

/**
 * POST /api/records/:id/comments
 * Add a comment to a record
 */
router.post('/records/:id/comments', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { content, comment_type } = req.body;
    const author_id = req.user?.id;

    if (!id || isNaN(Number(id))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid record ID',
      } as ApiResponse);
    }

    if (!content || !comment_type || !author_id) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: content, comment_type',
      } as ApiResponse);
    }

    const result = await pool.query(
      `INSERT INTO record_comments (waste_site_id, author_id, content, comment_type)
       VALUES ($1, $2, $3, $4)
       RETURNING id, waste_site_id, author_id, content, comment_type, created_at`,
      [id, author_id, content, comment_type]
    );

    const comment = result.rows[0];

    // Send email notification to record author
    const recordResult = await pool.query(
      'SELECT enumerator_email FROM waste_sites WHERE id = $1',
      [id]
    );
    if (recordResult.rows[0]?.enumerator_email && recordResult.rows[0].enumerator_email !== req.user?.email) {
      await emailService.sendCommentEmail(
        recordResult.rows[0].enumerator_email,
        req.user?.name || 'Administrator',
        Number(id),
        content
      );
    }

    return res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: comment,
    } as ApiResponse<RecordComment>);
  } catch (error: any) {
    console.error('Error adding comment:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    } as ApiResponse);
  }
});

/**
 * GET /api/records/:id/comments
 * Get all comments for a record
 */
router.get('/records/:id/comments', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(Number(id))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid record ID',
      } as ApiResponse);
    }

    const result = await pool.query(
      `SELECT c.id, c.waste_site_id, c.author_id, c.content, c.comment_type, c.created_at,
              e.name as author_name
       FROM record_comments c
       LEFT JOIN enumerators e ON c.author_id = e.id
       WHERE c.waste_site_id = $1
       ORDER BY c.created_at DESC`,
      [id]
    );

    return res.status(200).json({
      success: true,
      message: 'Comments retrieved successfully',
      data: result.rows,
    } as ApiResponse);
  } catch (error: any) {
    console.error('Error retrieving comments:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    } as ApiResponse);
  }
});

/**
 * DELETE /api/records/:id/comments/:commentId
 * Delete a comment
 */
router.delete('/records/:id/comments/:commentId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id, commentId } = req.params;

    if (!commentId || isNaN(Number(commentId))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid comment ID',
      } as ApiResponse);
    }

    // Check if user is comment author or admin
    const result = await pool.query(
      'SELECT author_id FROM record_comments WHERE id = $1',
      [commentId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found',
      } as ApiResponse);
    }

    if (result.rows[0].author_id !== req.user?.id && req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete other users comments',
      } as ApiResponse);
    }

    await pool.query('DELETE FROM record_comments WHERE id = $1', [commentId]);

    return res.status(200).json({
      success: true,
      message: 'Comment deleted successfully',
    } as ApiResponse);
  } catch (error: any) {
    console.error('Error deleting comment:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    } as ApiResponse);
  }
});

/**
 * POST /api/assignments
 * Create a new enumerator assignment
 */
router.post('/assignments', authMiddleware, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { enumerator_id, ward, target_records, description, status } = req.body;
    const assigned_by = req.user?.id;

    if (!enumerator_id || !ward) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: enumerator_id, ward',
      } as ApiResponse);
    }

    const result = await pool.query(
      `INSERT INTO enumerator_assignments (enumerator_id, ward, assigned_by, target_records, description, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, enumerator_id, ward, assigned_by, target_records, description, status, assigned_at`,
      [enumerator_id, ward, assigned_by, target_records || null, description || null, status || 'active']
    );

    const assignment = result.rows[0];

    // Get enumerator email and send assignment notification
    const enumResult = await pool.query('SELECT email, name FROM enumerators WHERE id = $1', [enumerator_id]);
    if (enumResult.rows[0]) {
      await emailService.sendAssignmentEmail(
        enumResult.rows[0].email,
        enumResult.rows[0].name,
        ward,
        target_records || 0
      );
    }

    return res.status(201).json({
      success: true,
      message: 'Assignment created successfully',
      data: assignment,
    } as ApiResponse<EnumeratorAssignment>);
  } catch (error: any) {
    console.error('Error creating assignment:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    } as ApiResponse);
  }
});

/**
 * GET /api/assignments
 * Get all assignments
 */
router.get('/assignments', async (req: Request, res: Response) => {
  try {
    const enumerator_id = req.query.enumerator_id as string | undefined;
    const status = req.query.status as string | undefined;

    let sql = `SELECT a.id, a.enumerator_id, a.ward, a.assigned_by, a.target_records, 
                      a.description, a.status, a.assigned_at, e.name, e.email
               FROM enumerator_assignments a
               LEFT JOIN enumerators e ON a.enumerator_id = e.id`;

    const params: any[] = [];
    const conditions: string[] = [];

    if (enumerator_id) {
      conditions.push(`a.enumerator_id = $${params.length + 1}`);
      params.push(Number(enumerator_id));
    }

    if (status) {
      conditions.push(`a.status = $${params.length + 1}`);
      params.push(status);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY a.assigned_at DESC';

    const result = await pool.query(sql, params);

    return res.status(200).json({
      success: true,
      message: 'Assignments retrieved successfully',
      data: result.rows,
    } as ApiResponse);
  } catch (error: any) {
    console.error('Error retrieving assignments:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    } as ApiResponse);
  }
});

/**
 * GET /api/assignments/:id
 * Get a specific assignment
 */
router.get('/assignments/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(Number(id))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid assignment ID',
      } as ApiResponse);
    }

    const result = await pool.query(
      `SELECT a.id, a.enumerator_id, a.ward, a.assigned_by, a.target_records,
              a.description, a.status, a.assigned_at, e.name, e.email
       FROM enumerator_assignments a
       LEFT JOIN enumerators e ON a.enumerator_id = e.id
       WHERE a.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found',
      } as ApiResponse);
    }

    return res.status(200).json({
      success: true,
      message: 'Assignment retrieved successfully',
      data: result.rows[0],
    } as ApiResponse<EnumeratorAssignment>);
  } catch (error: any) {
    console.error('Error retrieving assignment:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    } as ApiResponse);
  }
});

/**
 * PATCH /api/assignments/:id
 * Update an assignment
 */
router.patch('/assignments/:id', authMiddleware, requireSupervisor, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, target_records, description } = req.body;

    if (!id || isNaN(Number(id))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid assignment ID',
      } as ApiResponse);
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (status !== undefined) {
      updates.push(`status = $${paramCount}`);
      values.push(status);
      paramCount++;
    }

    if (target_records !== undefined) {
      updates.push(`target_records = $${paramCount}`);
      values.push(target_records);
      paramCount++;
    }

    if (description !== undefined) {
      updates.push(`description = $${paramCount}`);
      values.push(description);
      paramCount++;
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update',
      } as ApiResponse);
    }

    values.push(id);

    const result = await pool.query(
      `UPDATE enumerator_assignments SET ${updates.join(', ')}, updated_at = NOW()
       WHERE id = $${paramCount}
       RETURNING id, enumerator_id, ward, assigned_by, target_records, description, status, assigned_at`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found',
      } as ApiResponse);
    }

    return res.status(200).json({
      success: true,
      message: 'Assignment updated successfully',
      data: result.rows[0],
    } as ApiResponse<EnumeratorAssignment>);
  } catch (error: any) {
    console.error('Error updating assignment:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    } as ApiResponse);
  }
});

/**
 * DELETE /api/assignments/:id
 * Delete an assignment
 */
router.delete('/assignments/:id', authMiddleware, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(Number(id))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid assignment ID',
      } as ApiResponse);
    }

    const result = await pool.query(
      'DELETE FROM enumerator_assignments WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found',
      } as ApiResponse);
    }

    return res.status(200).json({
      success: true,
      message: 'Assignment deleted successfully',
    } as ApiResponse);
  } catch (error: any) {
    console.error('Error deleting assignment:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    } as ApiResponse);
  }
});

/**
 * POST /api/upload/image
 * Upload image to Cloudinary
 */
router.post('/upload/image', upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided',
        error: 'image field is required',
      } as ApiResponse);
    }

    // Validate image
    const validation = cloudinaryUploadService.validateImageFile(req.file.buffer, req.file.originalname);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.error || 'Invalid image file',
      } as ApiResponse);
    }

    // Upload to Cloudinary
    const imageUrl = await cloudinaryUploadService.uploadImage(req.file.buffer, req.file.originalname);

    return res.status(200).json({
      success: true,
      message: 'Image uploaded successfully',
      data: { image_url: imageUrl },
    } as ApiResponse);
  } catch (error: any) {
    console.error('Error uploading image:', error);
    return res.status(500).json({
      success: false,
      message: 'Image upload failed',
      error: error.message,
    } as ApiResponse);
  }
});

export default router;

