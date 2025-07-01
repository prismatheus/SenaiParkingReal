import express from 'express';
// Import your controller functions
import {
    registerGarageEntry,
    registerGarageExit,
    getGarageEntries,
    getGarageAvailableSpots
} from '../controllers/garage.js';
// Import your authentication middleware
import auth from '../middlewares/authMiddleware.js'; // Adjust path if needed

const garageRouter = express.Router();

// --- Routes for Parking Operations ---

// POST /api/garage/entry
// Allows an authenticated admin to register a car entering the garage.
garageRouter.post('/garage/entry', auth, registerGarageEntry);

// POST /api/garage/exit
// Allows an authenticated admin to register a car exiting the garage.
garageRouter.post('/garage/exit', auth, registerGarageExit);

// GET /api/garage/entries
// Allows an authenticated admin to view all garage entry/exit logs.
garageRouter.get('/garage/records', auth, getGarageEntries);

garageRouter.get('/garage/available-spots', auth, getGarageAvailableSpots);

export default garageRouter;