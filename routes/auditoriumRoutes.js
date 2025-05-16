import express from 'express';
import {
    getAllAuditoriums,
    getAuditoriumByCode,
    getAuditoriumsByFloor,
    getAuditoriumsByCharacteristics,
    getAvailableAuditoriums
} from '../controllers/auditoriumController.js';

const router = express.Router();

// Rutas para los salones
router.get('/', getAllAuditoriums);
router.get('/code/:code', getAuditoriumByCode);
router.get('/floor/:floor', getAuditoriumsByFloor);
router.get('/characteristic/:characteristic', getAuditoriumsByCharacteristics);
router.get('/available', getAvailableAuditoriums);

export { router };
