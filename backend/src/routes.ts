import { Router, Request, Response } from 'express';
import multer from 'multer';
import { WasteService } from './service';
import { AuthService } from './authService';
import { PasswordResetService } from './passwordResetService';
import { cloudinaryUploadService } from './cloudinaryService';
import { emailService } from './emailService';
import { otpService } from './otpService';
import { notificationService } from './notificationService';
import { SurveyService, SurveyFormConfig } from './surveyService';
import { ProjectService } from './projectService';
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
 * DEPRECATED: Use /api/auth/otp/request instead
 * Account creation is now STRICTLY OTP-verified only
 */
router.post('/auth/signup', async (req: Request, res: Response) => {
  return res.status(405).json({
    success: false,
    message: 'Direct signup is not allowed. Use OTP-based registration instead.',
    error: 'Please use POST /api/auth/otp/request to start the registration process.',
  } as ApiResponse);
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

    // Get user's projects (multi-tenancy support)
    const projects = await ProjectService.getEnumeratorProjects(enumerator.id);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: enumerator,
        projects,
        current_project_id: enumerator.primary_project_id || (projects.length > 0 ? projects[0].project.id : null),
      },
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
 * POST /api/auth/otp/request
 * Request OTP for signup - saves pending signup and sends OTP email
 */
router.post('/auth/otp/request', async (req: Request, res: Response) => {
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

    // Check if email already exists
    const existingUser = await AuthService.getEnumeratorByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered',
      } as ApiResponse);
    }

    // Save pending signup data
    await otpService.savePendingSignup({ email, password, name, ward, phone });

    // Generate and send OTP
    await otpService.generateAndSendOTP(email);

    return res.status(200).json({
      success: true,
      message: 'OTP sent to your email. Please check your inbox.',
      data: { email },
    } as ApiResponse);
  } catch (error: any) {
    console.error('Error requesting OTP:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to request OTP',
      error: error.message,
    } as ApiResponse);
  }
});

/**
 * POST /api/auth/otp/verify
 * Verify OTP and complete registration
 */
router.post('/auth/otp/verify', async (req: Request, res: Response) => {
  try {
    const { email, otp, project_id, role_id } = req.body;

    // Validate required fields
    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        error: 'email and otp are required',
      } as ApiResponse);
    }

    // Verify OTP
    await otpService.verifyOTP(email, otp);

    // Get verified signup data
    const signupData = await otpService.getVerifiedSignupData(email);

    if (!signupData) {
      return res.status(400).json({
        success: false,
        message: 'Signup data not found or expired',
      } as ApiResponse);
    }

    // Complete registration
    const enumerator = await AuthService.completeOTPRegistration(signupData);

    // Mark account as verified in database
    await pool.query(
      `UPDATE enumerators SET account_verification_completed = TRUE, verified_at = NOW() WHERE email = $1`,
      [email]
    );

    // Handle project association (multi-tenancy)
    let assignedProjectId = null;
    if (project_id) {
      try {
        // If project_id provided, assign user to existing project
        const roleId = role_id || 3; // Default to data_collector role
        await ProjectService.grantProjectAccess(enumerator.id, project_id, roleId);
        assignedProjectId = project_id;
      } catch (projectError: any) {
        console.warn('Could not assign to project:', projectError.message);
        // Don't fail signup if project assignment fails
      }
    } else {
      // Create default project for new user
      try {
        const defaultProject = await ProjectService.createProject(
          `${signupData.name}'s Project`,
          'Default project for new user',
          enumerator.id
        );
        await ProjectService.setDefaultProject(enumerator.id, defaultProject.id);
        assignedProjectId = defaultProject.id;
      } catch (projectError: any) {
        console.warn('Could not create default project:', projectError.message);
        // Don't fail signup if default project creation fails
      }
    }

    // Send verification confirmation notification
    try {
      await notificationService.sendVerificationNotification(
        email,
        signupData.name,
        otp
      );
    } catch (notificationError: any) {
      console.error('Error sending verification notification:', notificationError.message);
      // Don't fail the signup if notification fails
    }

    // Cleanup: delete from pending_signups and otp_verifications
    await pool.query('DELETE FROM otp_verifications WHERE email = $1', [email]);
    await pool.query('DELETE FROM pending_signups WHERE email = $1', [email]);

    // Get projects for response
    const projects = await ProjectService.getEnumeratorProjects(enumerator.id);

    return res.status(201).json({
      success: true,
      message: 'Email verified and account created successfully',
      data: {
        user: enumerator,
        projects,
        current_project_id: assignedProjectId || (projects.length > 0 ? projects[0].project.id : null),
      },
    } as ApiResponse);
  } catch (error: any) {
    console.error('Error verifying OTP:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'OTP verification failed',
      error: error.message,
    } as ApiResponse);
  }
});

/**
 * POST /api/auth/otp/resend
 * Resend OTP code
 */
router.post('/auth/otp/resend', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    // Validate required fields
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      } as ApiResponse);
    }

    // Resend OTP
    await otpService.resendOTP(email);

    return res.status(200).json({
      success: true,
      message: 'OTP resent to your email',
      data: { email },
    } as ApiResponse);
  } catch (error: any) {
    console.error('Error resending OTP:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to resend OTP',
      error: error.message,
    } as ApiResponse);
  }
});

/**
 * POST /api/auth/forgot-password
 * Request password reset
 */
router.post('/auth/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    // Validate required fields
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      } as ApiResponse);
    }

    // Request password reset
    const result = await PasswordResetService.requestPasswordReset(email);

    return res.status(200).json({
      success: result.success,
      message: result.message,
      data: { email },
    } as ApiResponse);
  } catch (error: any) {
    console.error('Password reset request error:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to process password reset request',
      error: error.message,
    } as ApiResponse);
  }
});

/**
 * POST /api/auth/verify-reset-token
 * Verify password reset token
 */
router.post('/auth/verify-reset-token', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    // Validate required fields
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Reset token is required',
      } as ApiResponse);
    }

    // Verify token
    const verification = await PasswordResetService.verifyResetToken(token);

    return res.status(200).json({
      success: verification.valid,
      message: verification.valid ? 'Token is valid' : 'Token is invalid or expired',
      data: verification.valid ? { email: verification.email } : undefined,
    } as ApiResponse);
  } catch (error: any) {
    console.error('Token verification error:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to verify token',
      error: error.message,
    } as ApiResponse);
  }
});

/**
 * POST /api/auth/reset-password
 * Reset password with token
 */
router.post('/auth/reset-password', async (req: Request, res: Response) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    // Validate required fields
    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token and new password are required',
      } as ApiResponse);
    }

    // Validate password match
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match',
      } as ApiResponse);
    }

    // Validate password strength
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters',
      } as ApiResponse);
    }

    // Reset password
    const result = await PasswordResetService.resetPassword(token, newPassword);

    return res.status(200).json({
      success: result.success,
      message: result.message,
    } as ApiResponse);
  } catch (error: any) {
    console.error('Password reset error:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to reset password',
      error: error.message,
    } as ApiResponse);
  }
});

/**
 * POST /api/profile/picture
 * Upload profile picture
 */
router.post('/profile/picture', authMiddleware, upload.single('image'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided',
      } as ApiResponse);
    }

    if (!req.user?.email) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      } as ApiResponse);
    }

    // Upload to Cloudinary
    const uploadResult = await cloudinaryUploadService.uploadProfilePicture(
      req.file.buffer,
      req.file.originalname,
      req.user.email
    );

    // Update user profile picture URL
    const updatedUser = await AuthService.updateProfilePicture(
      req.user.email,
      uploadResult.secure_url
    );

    return res.status(200).json({
      success: true,
      message: 'Profile picture uploaded successfully',
      data: updatedUser,
    } as ApiResponse);
  } catch (error: any) {
    console.error('Error uploading profile picture:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload profile picture',
      error: error.message,
    } as ApiResponse);
  }
});

/**
 * GET /api/profile
 * Get current user's profile
 */
router.get('/profile', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.email) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      } as ApiResponse);
    }

    const user = await AuthService.getEnumeratorByEmail(req.user.email);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      } as ApiResponse);
    }

    return res.status(200).json({
      success: true,
      message: 'Profile retrieved successfully',
      data: user,
    } as ApiResponse);
  } catch (error: any) {
    console.error('Error retrieving profile:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve profile',
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

/**
 * SURVEY MANAGEMENT ENDPOINTS
 */

/**
 * GET /api/surveys
 * Get all available surveys for authenticated user
 */
router.get('/surveys', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.email) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      } as ApiResponse);
    }

    const surveys = await SurveyService.getAvailableSurveys(req.user.email);

    return res.status(200).json({
      success: true,
      message: 'Surveys retrieved successfully',
      data: surveys,
    } as ApiResponse);
  } catch (error: any) {
    console.error('Error fetching surveys:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch surveys',
      error: error.message,
    } as ApiResponse);
  }
});

/**
 * GET /api/surveys/default
 * Get default survey
 */
router.get('/surveys/default', async (req: Request, res: Response) => {
  try {
    const survey = await SurveyService.getDefaultSurvey();

    return res.status(200).json({
      success: true,
      message: 'Default survey retrieved',
      data: survey,
    } as ApiResponse);
  } catch (error: any) {
    console.error('Error fetching default survey:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch default survey',
      error: error.message,
    } as ApiResponse);
  }
});

/**
 * GET /api/surveys/:id
 * Get survey by ID
 */
router.get('/surveys/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(Number(id))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid survey ID',
      } as ApiResponse);
    }

    const survey = await SurveyService.getSurveyById(Number(id));

    if (!survey) {
      return res.status(404).json({
        success: false,
        message: 'Survey not found',
      } as ApiResponse);
    }

    return res.status(200).json({
      success: true,
      message: 'Survey retrieved successfully',
      data: survey,
    } as ApiResponse);
  } catch (error: any) {
    console.error('Error fetching survey:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch survey',
      error: error.message,
    } as ApiResponse);
  }
});

/**
 * POST /api/surveys
 * Create new survey
 */
router.post('/surveys', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.email) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      } as ApiResponse);
    }

    const { title, formConfig, description, organization, isPublic } = req.body;

    if (!title || !formConfig) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: title and formConfig',
      } as ApiResponse);
    }

    const survey = await SurveyService.createSurvey(
      title,
      formConfig as SurveyFormConfig,
      req.user.email,
      { description, organization, isPublic }
    );

    return res.status(201).json({
      success: true,
      message: 'Survey created successfully',
      data: survey,
    } as ApiResponse);
  } catch (error: any) {
    console.error('Error creating survey:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to create survey',
      error: error.message,
    } as ApiResponse);
  }
});

/**
 * PUT /api/surveys/:id
 * Update survey
 */
router.put('/surveys/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!id || isNaN(Number(id))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid survey ID',
      } as ApiResponse);
    }

    const survey = await SurveyService.updateSurvey(Number(id), updates);

    return res.status(200).json({
      success: true,
      message: 'Survey updated successfully',
      data: survey,
    } as ApiResponse);
  } catch (error: any) {
    console.error('Error updating survey:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to update survey',
      error: error.message,
    } as ApiResponse);
  }
});

/**
 * DELETE /api/surveys/:id
 * Delete survey
 */
router.delete('/surveys/:id', authMiddleware, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(Number(id))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid survey ID',
      } as ApiResponse);
    }

    const deleted = await SurveyService.deleteSurvey(Number(id));

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Survey not found',
      } as ApiResponse);
    }

    return res.status(200).json({
      success: true,
      message: 'Survey deleted successfully',
    } as ApiResponse);
  } catch (error: any) {
    console.error('Error deleting survey:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete survey',
      error: error.message,
    } as ApiResponse);
  }
});

/**
 * POST /api/surveys/:id/submit
 * Submit survey response
 */
router.post('/surveys/:id/submit', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { responseData, latitude, longitude, isDraft } = req.body;

    if (!id || isNaN(Number(id))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid survey ID',
      } as ApiResponse);
    }

    if (!responseData) {
      return res.status(400).json({
        success: false,
        message: 'Response data is required',
      } as ApiResponse);
    }

    const submission = await SurveyService.submitSurveyResponse(
      Number(id),
      responseData,
      {
        latitude,
        longitude,
        enumeratorEmail: req.user?.email,
        enumeratorName: (req.user as any)?.name,
        isDraft,
      }
    );

    return res.status(201).json({
      success: true,
      message: 'Survey submitted successfully',
      data: submission,
    } as ApiResponse);
  } catch (error: any) {
    console.error('Error submitting survey:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to submit survey',
      error: error.message,
    } as ApiResponse);
  }
});

/**
 * GET /api/surveys/:id/submissions
 * Get survey submissions
 */
router.get('/surveys/:id/submissions', authMiddleware, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, enumeratorEmail } = req.query;

    if (!id || isNaN(Number(id))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid survey ID',
      } as ApiResponse);
    }

    const submissions = await SurveyService.getSurveySubmissions(Number(id), {
      status: status as string | undefined,
      enumeratorEmail: enumeratorEmail as string | undefined,
    });

    return res.status(200).json({
      success: true,
      message: 'Submissions retrieved successfully',
      data: submissions,
    } as ApiResponse);
  } catch (error: any) {
    console.error('Error fetching submissions:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch submissions',
      error: error.message,
    } as ApiResponse);
  }
});

/**
 * GET /api/survey-templates
 * Get available survey templates
 */
router.get('/survey-templates', async (req: Request, res: Response) => {
  try {
    const templates = await SurveyService.getSurveyTemplates();

    return res.status(200).json({
      success: true,
      message: 'Templates retrieved successfully',
      data: templates,
    } as ApiResponse);
  } catch (error: any) {
    console.error('Error fetching templates:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch templates',
      error: error.message,
    } as ApiResponse);
  }
});

/**
 * POST /api/surveys/import
 * Import survey from JSON
 */
router.post('/surveys/import', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.email) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      } as ApiResponse);
    }

    const { jsonData } = req.body;

    if (!jsonData) {
      return res.status(400).json({
        success: false,
        message: 'jsonData is required',
      } as ApiResponse);
    }

    const survey = await SurveyService.importSurveyFromJSON(jsonData, req.user.email);

    return res.status(201).json({
      success: true,
      message: 'Survey imported successfully',
      data: survey,
    } as ApiResponse);
  } catch (error: any) {
    console.error('Error importing survey:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to import survey',
      error: error.message,
    } as ApiResponse);
  }
});

/**
 * GET /api/surveys/:id/export
 * Export survey as JSON
 */
router.get('/surveys/:id/export', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(Number(id))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid survey ID',
      } as ApiResponse);
    }

    const survey = await SurveyService.getSurveyById(Number(id));

    if (!survey) {
      return res.status(404).json({
        success: false,
        message: 'Survey not found',
      } as ApiResponse);
    }

    const jsonData = SurveyService.exportSurveyToJSON(survey);

    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="survey_${survey.id}_${Date.now()}.json"`
    );
    res.send(jsonData);
  } catch (error: any) {
    console.error('Error exporting survey:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to export survey',
      error: error.message,
    } as ApiResponse);
  }
});

/**
 * ACCOUNT MANAGEMENT ENDPOINTS
 */

/**
 * DELETE /api/account/delete
 * Permanently delete user account (DANGEROUS - requires authentication)
 */
router.delete('/account/delete', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.email) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      } as ApiResponse);
    }

    const { confirmPassword } = req.body;

    // Require password confirmation for security
    if (!confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Password confirmation is required to delete account',
      } as ApiResponse);
    }

    // Verify password
    try {
      await AuthService.authenticateEnumerator(req.user.email, confirmPassword);
    } catch {
      return res.status(401).json({
        success: false,
        message: 'Incorrect password',
      } as ApiResponse);
    }

    // Get user info before deletion for notification
    const user = await AuthService.getEnumeratorByEmail(req.user.email);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      } as ApiResponse);
    }

    // Send deletion confirmation notification BEFORE deleting
    try {
      await notificationService.sendDeletionNotification(
        req.user.email,
        user.name
      );
    } catch (notificationError: any) {
      console.error('Error sending deletion notification:', notificationError.message);
      // Continue with deletion even if notification fails
    }

    // Delete account (this cascades to all related data)
    const deleted = await AuthService.deleteEnumeratorByEmail(req.user.email);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      } as ApiResponse);
    }

    return res.status(200).json({
      success: true,
      message: 'Account deleted permanently. A confirmation email has been sent.',
      data: { email: req.user.email, deletedAt: new Date().toISOString() },
    } as ApiResponse);
  } catch (error: any) {
    console.error('Error deleting account:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete account',
      error: error.message,
    } as ApiResponse);
  }
});

/**
 * NOTIFICATION ENDPOINTS
 */

/**
 * GET /api/notifications
 * Get all notifications for authenticated user
 */
router.get('/notifications', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.email) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      } as ApiResponse);
    }

    const limit = parseInt(req.query.limit as string) || 20;
    const notifications = await notificationService.getUserNotifications(req.user.email, limit);

    return res.status(200).json({
      success: true,
      message: 'Notifications retrieved successfully',
      data: notifications,
    } as ApiResponse);
  } catch (error: any) {
    console.error('Error retrieving notifications:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve notifications',
      error: error.message,
    } as ApiResponse);
  }
});

/**
 * PUT /api/notifications/:id/read
 * Mark notification as read
 */
router.put('/notifications/:id/read', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(Number(id))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid notification ID',
      } as ApiResponse);
    }

    const marked = await notificationService.markNotificationAsRead(Number(id));

    if (!marked) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      } as ApiResponse);
    }

    return res.status(200).json({
      success: true,
      message: 'Notification marked as read',
    } as ApiResponse);
  } catch (error: any) {
    console.error('Error marking notification as read:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to mark notification as read',
      error: error.message,
    } as ApiResponse);
  }
});

/**
 * DELETE /api/notifications
 * Clear all notifications for authenticated user
 */
router.delete('/notifications', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.email) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      } as ApiResponse);
    }

    const cleared = await notificationService.clearUserNotifications(req.user.email);

    return res.status(200).json({
      success: true,
      message: `${cleared} notifications cleared`,
      data: { cleared },
    } as ApiResponse);
  } catch (error: any) {
    console.error('Error clearing notifications:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to clear notifications',
      error: error.message,
    } as ApiResponse);
  }
});

// ============================================================================
// PROJECT MANAGEMENT ROUTES (Multi-Tenancy)
// ============================================================================

/**
 * POST /api/projects
 * Create a new project (admin only)
 */
router.post('/projects', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;
    const authReq = req as AuthRequest;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Project name is required',
      } as ApiResponse);
    }

    const project = await ProjectService.createProject(
      name,
      description || '',
      authReq.user.id
    );

    // Grant creator admin access
    const adminRole = 1; // admin role ID
    await ProjectService.grantProjectAccess(authReq.user.id, project.id, adminRole);

    // Set as default project
    await ProjectService.setDefaultProject(authReq.user.id, project.id);

    return res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: project,
    } as ApiResponse);
  } catch (error: any) {
    console.error('Error creating project:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to create project',
      error: error.message,
    } as ApiResponse);
  }
});

/**
 * GET /api/projects
 * Get all projects for the logged-in user
 */
router.get('/projects', authMiddleware, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const projects = await ProjectService.getEnumeratorProjects(authReq.user.id);

    return res.status(200).json({
      success: true,
      message: 'Projects retrieved successfully',
      data: projects,
    } as ApiResponse);
  } catch (error: any) {
    console.error('Error fetching projects:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch projects',
      error: error.message,
    } as ApiResponse);
  }
});

/**
 * GET /api/projects/:id
 * Get a specific project
 */
router.get('/projects/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const authReq = req as AuthRequest;

    // Check if user has access to this project
    const hasAccess = await ProjectService.hasProjectAccess(authReq.user.id, id);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this project',
      } as ApiResponse);
    }

    const project = await ProjectService.getProject(id);

    return res.status(200).json({
      success: true,
      message: 'Project retrieved successfully',
      data: project,
    } as ApiResponse);
  } catch (error: any) {
    console.error('Error fetching project:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch project',
      error: error.message,
    } as ApiResponse);
  }
});

/**
 * GET /api/projects/:id/enumerators
 * Get all enumerators in a project (supervisor+ only)
 */
router.get('/projects/:id/enumerators', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const authReq = req as AuthRequest;

    // Check permission
    const hasPermission = await ProjectService.hasPermission(
      authReq.user.id,
      id,
      'manage_team'
    );
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: 'Permission denied. You need manage_team permission.',
      } as ApiResponse);
    }

    const enumerators = await ProjectService.getProjectEnumerators(id);

    return res.status(200).json({
      success: true,
      message: 'Enumerators retrieved successfully',
      data: enumerators,
    } as ApiResponse);
  } catch (error: any) {
    console.error('Error fetching enumerators:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch enumerators',
      error: error.message,
    } as ApiResponse);
  }
});

/**
 * POST /api/projects/:id/invite
 * Invite an enumerator to a project
 */
router.post('/projects/:id/invite', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { email, role_id } = req.body;
    const authReq = req as AuthRequest;

    if (!email || !role_id) {
      return res.status(400).json({
        success: false,
        message: 'Email and role_id are required',
      } as ApiResponse);
    }

    // Check permission
    const hasPermission = await ProjectService.hasPermission(
      authReq.user.id,
      id,
      'manage_team'
    );
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: 'Permission denied. You need manage_team permission.',
      } as ApiResponse);
    }

    const invite = await ProjectService.createProjectInvite(id, email, role_id);

    // TODO: Send email with invite link
    // const inviteLink = `${process.env.FRONTEND_URL}/accept-invite/${invite.invite_code}`;
    // await emailService.sendProjectInviteEmail(email, inviteLink);

    return res.status(201).json({
      success: true,
      message: 'Invitation sent successfully',
      data: invite,
    } as ApiResponse);
  } catch (error: any) {
    console.error('Error sending invitation:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to send invitation',
      error: error.message,
    } as ApiResponse);
  }
});

/**
 * POST /api/projects/invite/:code/accept
 * Accept a project invitation
 */
router.post('/projects/invite/:code/accept', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { code } = req.params;
    const authReq = req as AuthRequest;

    const invite = await ProjectService.acceptProjectInvite(code, authReq.user.id);

    return res.status(200).json({
      success: true,
      message: 'Invitation accepted successfully',
      data: invite,
    } as ApiResponse);
  } catch (error: any) {
    console.error('Error accepting invitation:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to accept invitation',
      error: error.message,
    } as ApiResponse);
  }
});

/**
 * GET /api/projects/pending-invites
 * Get pending invitations for the user's email
 */
router.get('/projects/pending-invites', authMiddleware, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const invites = await ProjectService.getPendingInvitations(authReq.user.email);

    return res.status(200).json({
      success: true,
      message: 'Pending invitations retrieved successfully',
      data: invites,
    } as ApiResponse);
  } catch (error: any) {
    console.error('Error fetching invitations:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch invitations',
      error: error.message,
    } as ApiResponse);
  }
});

/**
 * POST /api/projects/:id/forms/:formId/share
 * Share a form with an enumerator
 */
router.post('/projects/:id/forms/:formId/share', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id, formId } = req.params;
    const { enumerator_id } = req.body;
    const authReq = req as AuthRequest;

    if (!enumerator_id) {
      return res.status(400).json({
        success: false,
        message: 'enumerator_id is required',
      } as ApiResponse);
    }

    // Check permission
    const hasPermission = await ProjectService.hasPermission(
      authReq.user.id,
      id,
      'share_forms'
    );
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: 'Permission denied. You need share_forms permission.',
      } as ApiResponse);
    }

    const sharing = await ProjectService.shareFormWithEnumerator(
      formId,
      enumerator_id,
      id,
      authReq.user.id
    );

    return res.status(201).json({
      success: true,
      message: 'Form shared successfully',
      data: sharing,
    } as ApiResponse);
  } catch (error: any) {
    console.error('Error sharing form:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to share form',
      error: error.message,
    } as ApiResponse);
  }
});

/**
 * GET /api/projects/:id/shared-forms
 * Get all forms shared with the user for a project
 */
router.get('/projects/:id/shared-forms', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const authReq = req as AuthRequest;

    // Check access
    const hasAccess = await ProjectService.hasProjectAccess(authReq.user.id, id);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this project',
      } as ApiResponse);
    }

    const forms = await ProjectService.getSharedForms(authReq.user.id, id);

    return res.status(200).json({
      success: true,
      message: 'Shared forms retrieved successfully',
      data: forms,
    } as ApiResponse);
  } catch (error: any) {
    console.error('Error fetching shared forms:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch shared forms',
      error: error.message,
    } as ApiResponse);
  }
});

/**
 * POST /api/auth/switch-project
 * Switch the active project for the user
 */
router.post('/auth/switch-project', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { project_id } = req.body;
    const authReq = req as AuthRequest;

    if (!project_id) {
      return res.status(400).json({
        success: false,
        message: 'project_id is required',
      } as ApiResponse);
    }

    // Check if user has access
    const hasAccess = await ProjectService.hasProjectAccess(authReq.user.id, project_id);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this project',
      } as ApiResponse);
    }

    // Set as default
    await ProjectService.setDefaultProject(authReq.user.id, project_id);

    // Get user's projects
    const projects = await ProjectService.getEnumeratorProjects(authReq.user.id);

    return res.status(200).json({
      success: true,
      message: 'Project switched successfully',
      data: {
        current_project_id: project_id,
        projects,
      },
    } as ApiResponse);
  } catch (error: any) {
    console.error('Error switching project:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to switch project',
      error: error.message,
    } as ApiResponse);
  }
});

export default router;

