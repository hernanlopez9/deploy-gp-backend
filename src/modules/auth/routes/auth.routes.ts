import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { verifyAccessToken } from '../middlewares/auth.middleware';

const router = Router();
// Rutas públicas
// eslint-disable-next-line @typescript-eslint/unbound-method
router.post('/register', AuthController.register);
// eslint-disable-next-line @typescript-eslint/unbound-method
router.post('/login', AuthController.login);
// eslint-disable-next-line @typescript-eslint/unbound-method
router.post('/logout', AuthController.logout);
// eslint-disable-next-line @typescript-eslint/unbound-method
router.post('/refresh', AuthController.refresh);

// Rutas protegidas (requieren access_token válido)
// eslint-disable-next-line @typescript-eslint/unbound-method
router.get('/profile', verifyAccessToken, AuthController.profile);
router.patch(
  '/change-password',
  verifyAccessToken,
  // eslint-disable-next-line @typescript-eslint/unbound-method
  AuthController.changePassword,
);

export default router;
