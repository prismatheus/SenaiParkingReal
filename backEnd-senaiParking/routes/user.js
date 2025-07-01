// routes/userRoutes.js
import express from 'express';
import { getUserById, registerUser, loginUser, deleteUser, getUserType, updateUser, getAllUsers, editOwnProfile } from '../controllers/user.js';
import auth from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);

router.get('/users', auth, getAllUsers);
router.get('/users/:id', auth, getUserById);
router.get('/user/type', auth, getUserType);

router.put('/users/:id', auth, updateUser);
router.put('/edit-profile', auth, editOwnProfile);
router.delete('/users/:id', auth, deleteUser);



export default router;