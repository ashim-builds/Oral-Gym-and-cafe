import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../utils/response';
import businessService from '../services/business.service';
import ownerService from '../services/owner.service';

export class BusinessController {
  /**
   * GET /api/business/details
   */
  async getBusinessDetails(req: Request, res: Response) {
    try {
      const business = await businessService.getBusinessDetails();
      return sendSuccess(res, business, 'Business details retrieved');
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to fetch business details', 400);
    }
  }

  /**
   * GET /api/owner/details
   */
  async getOwnerDetails(req: Request, res: Response) {
    try {
      const owner = await ownerService.getOwnerDetails();
      return sendSuccess(res, owner, 'Owner details retrieved');
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to fetch owner details', 400);
    }
  }
}

export const businessController = new BusinessController();
export default businessController;
