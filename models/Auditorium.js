import mongoose from 'mongoose';

const auditoriumSchema = new mongoose.Schema({
    code: String,
    name: String,
    floor: Number,
    capacity: Number,
    countedSeats: Number,
    comments: String,
    characteristic: String,
    type: String,
    tableType: String,
    chairType: String,
    boardType: String,
    equipment: String,
    outlets: String,
    mobility: String,
    environment: String,
    reservationContact: String,
    status: String,
    usableForReservations: Boolean
}, { timestamps: true });

export default mongoose.model('Auditorium', auditoriumSchema);
