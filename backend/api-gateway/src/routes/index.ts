import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { TransactionController } from '../controllers/transaction.controller';
import { AlertController } from '../controllers/alert.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Initialize controllers
const authController = new AuthController();
const transactionController = new TransactionController();
const alertController = new AlertController();

// Auth routes
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.get('/auth/me', authenticate, authController.me);

// Transaction routes
router.post('/transactions', authenticate, transactionController.create.bind(transactionController));
router.get('/transactions', authenticate, transactionController.getTransactions.bind(transactionController));
router.get('/transactions/stats', authenticate, transactionController.getStats.bind(transactionController));
router.get('/transactions/:id', authenticate, transactionController.getTransaction.bind(transactionController));
router.patch(
  '/transactions/:id',
  authenticate,
  authorize('admin', 'analyst'),
  transactionController.updateStatus.bind(transactionController)
);

// Alert routes
router.get('/alerts', authenticate, alertController.getAlerts.bind(alertController));
router.get('/alerts/stats', authenticate, alertController.getAlertStats.bind(alertController));
router.patch('/alerts/:id', authenticate, authorize('admin', 'analyst'), alertController.updateAlert.bind(alertController));

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

export default router;