import Auditorium from '../models/Auditorium.js';

// Obtener todos los salones
export const getAllAuditoriums = async (req, res) => {
    try {
        const auditoriums = await Auditorium.find();
        res.status(200).json(auditoriums);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Obtener un salón por su código
export const getAuditoriumByCode = async (req, res) => {
    try {
        const { code } = req.params;
        const auditorium = await Auditorium.findOne({ code });

        if (!auditorium) {
            return res.status(404).json({ message: 'Salón no encontrado' });
        }

        res.status(200).json(auditorium);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Obtener salones por piso
export const getAuditoriumsByFloor = async (req, res) => {
    try {
        const { floor } = req.params;
        const auditoriums = await Auditorium.find({ floor: Number(floor) });

        res.status(200).json(auditoriums);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Obtener salones por características
export const getAuditoriumsByCharacteristics = async (req, res) => {
    try {
        const { characteristic } = req.params;
        const auditoriums = await Auditorium.find({
            characteristic: new RegExp(characteristic, 'i')
        });

        res.status(200).json(auditoriums);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Obtener salones disponibles para reservas
export const getAvailableAuditoriums = async (req, res) => {
    try {
        const auditoriums = await Auditorium.find({
            usableForReservations: true,
            status: 'Disponible'
        });

        res.status(200).json(auditoriums);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};