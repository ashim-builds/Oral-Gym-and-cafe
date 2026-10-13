import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../utils/response';
import businessService from '../services/business.service';
import ownerService from '../services/owner.service';

import prisma from '../config/db';
import { ENV } from '../config/env';

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

  /**
   * GET /api/settings/delivery
   */
  async getDeliverySettings(req: Request, res: Response) {
    try {
      const settings = await prisma.setting.findMany({
        where: {
          key: { in: ['delivery_fee', 'delivery_charge', 'free_delivery_threshold'] },
        },
      });

      let delivery_charge = ENV.DEFAULT_DELIVERY_CHARGE;
      let free_delivery_threshold: number | null = null;

      for (const s of settings) {
        if (s.key === 'delivery_fee' || s.key === 'delivery_charge') {
          const val = parseFloat(s.value);
          if (!isNaN(val)) delivery_charge = val;
        }
        if (s.key === 'free_delivery_threshold') {
          const val = parseFloat(s.value);
          if (!isNaN(val)) free_delivery_threshold = val;
        }
      }

      return sendSuccess(res, {
        delivery_charge,
        free_delivery_threshold,
      }, 'Delivery settings retrieved');
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to fetch delivery settings', 400);
    }
  }
}

export const businessController = new BusinessController();
export default businessController;
