import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        // Fetch all paid orders from the last 7 days
        const orders = await prisma.order.findMany({
            where: {
                createdAt: {
                    gte: sevenDaysAgo
                }
                // In a real app we'd filter by status: 'PAID' but currently all are created as PAID
            },
            select: {
                total: true,
                createdAt: true
            }
        });

        // Group by day
        // Initialize last 7 days with 0
        const salesMap = new Map<string, number>();

        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toLocaleDateString("en-US", { day: "numeric", month: "short" }); // e.g., "Oct 25"
            salesMap.set(dateStr, 0);
        }

        // Aggregate order totals
        orders.forEach(order => {
            const dateStr = new Date(order.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "short" });
            if (salesMap.has(dateStr)) {
                salesMap.set(dateStr, (salesMap.get(dateStr) || 0) + order.total);
            }
        });

        // Convert to array
        const salesData = Array.from(salesMap.entries()).map(([date, revenue]) => ({
            date,
            revenue
        }));

        return NextResponse.json(salesData);
    } catch (error) {
        console.error("Failed to fetch sales stats:", error);
        return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
    }
}
