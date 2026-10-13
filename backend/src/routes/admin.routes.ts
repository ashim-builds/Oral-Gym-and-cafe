import { Router } from 'express';
import adminController from '../controllers/admin.controller';
import { authenticateAdmin } from '../middleware/auth.middleware';
import uploadController, { multerUpload } from '../controllers/upload.controller';

const router = Router();

// Public Admin Auth Route
router.post('/auth/login', (req, res) => adminController.login(req, res));

// Protected Admin Routes
router.use(authenticateAdmin);

router.get('/auth/me', (req, res) => adminController.getMe(req, res));
router.get('/dashboard', (req, res) => adminController.getDashboard(req, res));

// Products
router.get('/products', (req, res) => adminController.getProducts(req, res));
router.get('/products/:id', (req, res) => adminController.getProductById(req, res));
router.post('/products', (req, res) => adminController.createProduct(req, res));
router.put('/products/:id', (req, res) => adminController.updateProduct(req, res));
router.delete('/products/:id', (req, res) => adminController.deleteProduct(req, res));

// Categories
router.get('/categories', (req, res) => adminController.getCategories(req, res));
router.post('/categories', (req, res) => adminController.createCategory(req, res));
router.put('/categories/:id', (req, res) => adminController.updateCategory(req, res));
router.delete('/categories/:id', (req, res) => adminController.deleteCategory(req, res));

// Orders
router.get('/orders', (req, res) => adminController.getOrders(req, res));
router.get('/orders/:id', (req, res) => adminController.getOrderById(req, res));
router.put('/orders/:id/status', (req, res) => adminController.updateOrderStatus(req, res));

// Branches
router.get('/branches', (req, res) => adminController.getBranches(req, res));
router.post('/branches', (req, res) => adminController.createBranch(req, res));
router.put('/branches/:id', (req, res) => adminController.updateBranch(req, res));
router.delete('/branches/:id', (req, res) => adminController.deleteBranch(req, res));

// Customers (Safe: no OTPs)
router.get('/customers', (req, res) => adminController.getCustomers(req, res));
router.get('/customers/:id', (req, res) => adminController.getCustomerById(req, res));
router.delete('/customers/:id', (req, res) => adminController.deleteCustomer(req, res));


// Business & Owner Settings
router.put('/business', (req, res) => adminController.updateBusiness(req, res));
router.put('/owner', (req, res) => adminController.updateOwner(req, res));

// App Settings
router.get('/settings', (req, res) => adminController.getSettings(req, res));
router.put('/settings', (req, res) => adminController.updateSetting(req, res));

// Image Uploads (Multipart & Base64)
router.post('/upload', multerUpload.single('file'), (req, res) => uploadController.uploadFile(req, res));
router.post('/upload-base64', (req, res) => uploadController.uploadBase64(req, res));

export default router;
