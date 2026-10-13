import { Router } from 'express';
import branchController from '../controllers/branch.controller';
import { appCache } from '../utils/cache';

const router = Router();

// Public branch routes with 45s in-memory TTL caching
router.get('/', appCache.middleware(45, 'branches'), (req, res) => branchController.getBranches(req, res));
router.get('/ordering-branch', appCache.middleware(45, 'branches'), (req, res) => branchController.getOrderingBranch(req, res));
router.get('/:id', appCache.middleware(45, 'branches'), (req, res) => branchController.getBranchById(req, res));

export default router;
