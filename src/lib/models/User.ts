// src/lib/models/User.ts

import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
    uid: string;
    email: string;
    displayName: string;
    uniqueCode: string;
}

const UserSchema: Schema<IUser> = new Schema<IUser>(
    {
        uid: { type: String, required: true, unique: true },
        email: { type: String, required: true },
        displayName: { type: String, required: true },
        uniqueCode: { type: String, required: true, unique: true },
    },
    { timestamps: true }
);

// Avoid recompilation/model overwrite issues in serverless environments
const User: Model<IUser> = (mongoose.models.User as Model<IUser>) || mongoose.model<IUser>('User', UserSchema);

export default User;
