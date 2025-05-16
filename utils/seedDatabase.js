import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Auditorium from '../models/Auditorium.js';

dotenv.config();

const auditoriumsData = [
    {
        code: "EC-2.1",
        name: "Salón EC-2.1",
        floor: 2,
        capacity: 30,
        countedSeats: 28,
        comments: "Deberia ser para 28",
        characteristic: "Plano-MesaMov-SillaMov (64)",
        type: "Plano",
        tableType: "No tiene",
        chairType: "No tiene",
        boardType: "No tiene",
        equipment: "No tiene",
        outlets: "No tiene",
        mobility: "Limitada",
        environment: "OK",
        reservationContact: "Auto reservas  / reservasmultimedios@",
        status: "Disponible",
        usableForReservations: false
    },
    {
        code: "EC-2.2",
        name: "Salón EC-2.2",
        floor: 2,
        capacity: 30,
        countedSeats: 30,
        comments: "OK 30",
        characteristic: "Plano-MesaMov-SillaMov (64)",
        type: "Plano",
        tableType: "No tiene",
        chairType: "No tiene",
        boardType: "No tiene",
        equipment: "No tiene",
        outlets: "No tiene",
        mobility: "Limitada",
        environment: "OK",
        reservationContact: "Auto reservas  / reservasmultimedios@",
        status: "Disponible",
        usableForReservations: false
    },
    {
        code: "EC-2.3",
        name: "Salón EC-2.3",
        floor: 2,
        capacity: 30,
        countedSeats: 30,
        comments: "OK 30",
        characteristic: "Plano-MesaMov-SillaMov (64)",
        type: "Plano",
        tableType: "Móvil Para 3 Personas",
        chairType: "Móvil",
        boardType: "Fijo",
        equipment: "Proyector",
        outlets: "No Tiene",
        mobility: "Limitada",
        environment: "ok",
        reservationContact: "Auto reservas  / reservasmultimedios@",
        status: "En uso",
        usableForReservations: true
    },
    {
        code: "EC-2.4",
        name: "Salón EC-2.4",
        floor: 2,
        capacity: 30,
        countedSeats: 30,
        comments: "OK 30",
        characteristic: "Plano-MesaMov-SillaMov (64)",
        type: "Plano",
        tableType: "Móvil Para 3 Personas",
        chairType: "Móvil",
        boardType: "Fijo",
        equipment: "Proyector",
        outlets: "No Tiene",
        mobility: "Limitada",
        environment: "ok",
        reservationContact: "Auto reservas  / reservasmultimedios@",
        status: "En uso",
        usableForReservations: true
    },
    {
        code: "EC-3.1",
        name: "Salón EC-3.1",
        floor: 3,
        capacity: 35,
        countedSeats: 37,
        comments: "OK 35",
        characteristic: "Plano-MesaMov-SillaMov (64)",
        type: "Plano",
        tableType: "Móvil Individual",
        chairType: "Móvil",
        boardType: "Fijo",
        equipment: "Proyector",
        outlets: "No Tiene",
        mobility: "Limitada",
        environment: "ok",
        reservationContact: "Auto reservas  / reservasmultimedios@",
        status: "En uso",
        usableForReservations: true
    },
    {
        code: "EC-3.2",
        name: "Salón EC-3.2",
        floor: 3,
        capacity: 35,
        countedSeats: 36,
        comments: "Debería ser para 30",
        characteristic: "Plano-MesaMov-SillaMov (64)",
        type: "Plano",
        tableType: "Móvil Individual",
        chairType: "Móvil",
        boardType: "Fijo",
        equipment: "Proyector",
        outlets: "No Tiene",
        mobility: "Limitada",
        environment: "ok",
        reservationContact: "Auto reservas  / reservasmultimedios@",
        status: "En uso",
        usableForReservations: true
    },
    {
        code: "EC-3.3",
        name: "Salón EC-3.3",
        floor: 3,
        capacity: 35,
        countedSeats: 37,
        comments: "Debería ser para 33",
        characteristic: "Plano-MesaMov-SillaMov (64)",
        type: "Plano",
        tableType: "Móvil Individual",
        chairType: "Móvil",
        boardType: "Fijo",
        equipment: "Proyector",
        outlets: "No Tiene",
        mobility: "Limitada",
        environment: "ok",
        reservationContact: "Auto reservas  / reservasmultimedios@",
        status: "En uso",
        usableForReservations: true
    },
    {
        code: "EC-3.5",
        name: "Salón EC-3.5",
        floor: 3,
        capacity: 35,
        countedSeats: 26,
        comments: "Debería ser para 30",
        characteristic: "Aula Especial",
        type: "Plano",
        tableType: "Móvil Individual",
        chairType: "Móvil",
        boardType: "Fijo",
        equipment: "Proyector",
        outlets: "No Tiene",
        mobility: "Limitada",
        environment: "ok",
        reservationContact: "Auto reservas  / reservasmultimedios@",
        status: "En uso",
        usableForReservations: true
    },
    {
        code: "EC-A1-A2",
        name: "Salón EC-A1-A2",
        floor: 3,
        capacity: 100,
        countedSeats: 88,
        comments: "Espacio abierto unificado",
        characteristic: "Auditorio Grande",
        type: "Plano",
        tableType: "No Aplica",
        chairType: "Fijas",
        boardType: "Fijo",
        equipment: "Proyector y Sonido",
        outlets: "Tiene",
        mobility: "Buena",
        environment: "Muy bueno",
        reservationContact: "reservasmultimedios@unicatolica.edu.co",
        status: "Disponible",
        usableForReservations: true
    }
];

const seedDatabase = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        await Auditorium.deleteMany({});
        await Auditorium.insertMany(auditoriumsData);
        console.log('✅ Base de datos poblada con auditorios actualizados');
    } catch (error) {
        console.error('❌ Error al poblar la base de datos:', error);
    } finally {
        mongoose.connection.close();
    }
};

// Ejecutar con: node utils/seedDatabase.js --run
if (process.argv[2] === '--run') {
    seedDatabase();
}

export default seedDatabase;
