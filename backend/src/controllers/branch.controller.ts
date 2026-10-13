import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../utils/response';
import branchService from '../services/branch.service';

export class BranchController {
  /**
   * GET /api/branches
   */
  async getBranches(req: Request, res: Response) {
    try {
      const branches = await branchService.getPublicBranches();
      return sendSuccess(res, branches, 'Branches fetched successfully');
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to fetch branches', 400);
    }
  }

  /**
   * GET /api/branches/ordering-branch
   */
  async getOrderingBranch(req: Request, res: Response) {
    try {
      const branch = await branchService.getActiveOrderingBranch();
      return sendSuccess(res, branch, 'Active ordering branch fetched');
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to fetch active ordering branch', 400);
    }
  }

  /**
   * GET /api/branches/:id
   */
  async getBranchById(req: Request, res: Response) {
    try {
      const id = parseInt(String(req.params.id), 10);
      if (isNaN(id)) {
        return sendError(res, 'Invalid branch ID', 400);
      }
      const branch = await branchService.getBranchById(id);
      return sendSuccess(res, branch, 'Branch fetched successfully');
    } catch (err: any) {
      return sendError(res, err.message || 'Branch not found', 404);
    }
  }
}

export const branchController = new BranchController();
export default branchController;
