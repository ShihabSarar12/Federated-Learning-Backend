import { Router } from 'express';
import authController from '../../controllers/auth.controller';
import authenticate from '../../middlewares/auth.middleware';

const authRouter: Router = Router();

authRouter.post('/register', authController.register);
authRouter.post('/login', authController.login);
authRouter.get('/profile', authenticate, authController.profile);

export default authRouter;
