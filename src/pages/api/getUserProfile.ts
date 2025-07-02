// src/pages/api/getUserProfile.ts

import type { NextApiRequest, NextApiResponse } from "next";
import * as admin from "firebase-admin";
import { connectToDatabase } from "@/lib/db";
import User from "@/lib/models/User";

if (!admin.apps.length) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT!);
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "GET") {
        return res.status(405).json({ message: "Method not allowed" });
    }

    try {
        const idToken = (req.headers.authorization || "").replace("Bearer ", "");
        const decoded = await admin.auth().verifyIdToken(idToken);
        const uid = decoded.uid;

        await connectToDatabase();
        const user = await User.findOne({ uid });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.status(200).json({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            uniqueCode: user.uniqueCode,
        });
    } catch (error: any) {
        console.error("getUserProfile API error:", error);
        return res.status(401).json({ message: "Unauthorized" });
    }
}
