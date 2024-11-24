import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, },
    session: { type: String },
    year: { type: Number },
    courses: { type: String },
    fee: { type: Number },
});





const User = mongoose.model('User', userSchema);

export default User;
