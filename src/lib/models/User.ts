// src/lib/models/User.ts

import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
    uid: string;
    email: string;
    displayName: string;
    uniqueCode: string;
    coinsBalance: number;   // saldo de ThemiCoins
}

const UserSchema: Schema<IUser> = new Schema<IUser>(
    {
        uid: { type: String, required: true, unique: true },
        email: { type: String, required: true },
        displayName: { type: String, required: true },
        uniqueCode: { type: String, required: true, unique: true },
        coinsBalance: { type: Number, required: true, default: 0 },
    },
    { timestamps: true }
);

// Evitamos recrear el modelo en entornos serverless
const User: Model<IUser> =
    (mongoose.models.User as Model<IUser>) ||
    mongoose.model<IUser>('User', UserSchema);

export default User;
