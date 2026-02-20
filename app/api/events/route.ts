import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const events = await prisma.systemEvent.findMany({
            orderBy: { createdAt: 'desc' },
            take: 50
        });
        return NextResponse.json(events);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { type, message, metadata } = body;

        const event = await prisma.systemEvent.create({
            data: {
                type,
                message,
                metadata: metadata ? JSON.stringify(metadata) : null
            }
        });
        return NextResponse.json(event);
    } catch (error) {
        return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
    }
}

export async function DELETE() {
    try {
        await prisma.systemEvent.deleteMany();
        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: "Failed to clear events" }, { status: 500 });
    }
}
