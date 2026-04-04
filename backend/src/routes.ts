import { Router, Request, Response } from 'express';
import { WasteService } from './service';
import { ApiResponse, WasteSiteRecord } from '../../types';

const router = Router();

/**
 * POST /api/waste
 * Create a new waste site record
 */
router.post('/', async (req: Request, res: Response) => {
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

    const record = await WasteService.createWasteSite(data);

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
 * Retrieve all waste site records with pagination
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 1000;
    const offset = parseInt(req.query.offset as string) || 0;

    const { records, total } = await WasteService.getAllWasteSites(limit, offset);

    return res.status(200).json({
      success: true,
      message: 'Waste sites retrieved successfully',
      data: {
        records,
        pagination: {
          total,
          limit,
          offset,
          pages: Math.ceil(total / limit),
        },
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
router.get('/:id', async (req: Request, res: Response) => {
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
 * GET /api/waste/stats/summary
 * Get statistics summary
 */
router.get('/stats/summary', async (req: Request, res: Response) => {
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

export default router;
