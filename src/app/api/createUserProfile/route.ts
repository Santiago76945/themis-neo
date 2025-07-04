// src/app/api/createUserProfile/route.ts

import { NextRequest, NextResponse } from "next/server";
import * as admin from "firebase-admin";
import { connectToDatabase } from "@/lib/db";
import User from "@/lib/models/User";
// IMPORT CORRECTO según tu archivo src/utils/generateCode.ts
import { generateUniqueCode } from "@/utils/generateCode";

if (!admin.apps.length) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT!);
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
}

export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get("authorization") || "";
        const idToken = authHeader.replace("Bearer ", "");
        const decoded = await admin.auth().verifyIdToken(idToken);
        const { uid, email = "", name: displayName = "" } = decoded;

        await connectToDatabase();
        let user = await User.findOne({ uid });
        if (!user) {
            const uniqueCode = generateUniqueCode();
            user = await User.create({ uid, email, displayName, uniqueCode });
        }

        return NextResponse.json({ uniqueCode: user.uniqueCode });
    } catch (error: any) {
        console.error("createUserProfile error:", error);
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
}
