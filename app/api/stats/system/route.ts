import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";

export async function GET() {
    try {
        const productCount = await prisma.product.count();
        const orderCount = await prisma.order.count();
        const eventCount = await prisma.systemEvent.count();

        // Calculate DB size if using sqlite
        let storageUsage = "0 KB";
        try {
            const dbPath = path.join(process.cwd(), "prisma", "dev.db");
            if (fs.existsSync(dbPath)) {
                const stats = fs.statSync(dbPath);
                storageUsage = (stats.size / 1024).toFixed(2) + " KB";
            }
        } catch (e) {
            // Ignore file access errors
        }

        return NextResponse.json({
            status: "Optimal",
            productCount,
            orderCount,
            eventCount,
            storageUsage,
            storageLimit: "1 TB" // Fixed mock limit
        });
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch status" }, { status: 500 });
    }
}
