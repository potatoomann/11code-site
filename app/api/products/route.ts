import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const products = await prisma.product.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(products);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
    }
}



export async function POST(req: Request) {
    try {
        const body = await req.json();

        // Basic validation for critical fields only
        if (!body.name || body.name.trim() === "") {
            return NextResponse.json({
                error: "Missing required field",
                details: "Product name is required"
            }, { status: 400 });
        }

        if (!body.price || isNaN(parseFloat(body.price))) {
            return NextResponse.json({
                error: "Invalid price",
                details: "Price must be a valid number"
            }, { status: 400 });
        }

        const price = parseFloat(body.price);
        const stock = parseInt(body.stock || "10", 10);

        const product = await prisma.product.create({
            data: {
                productNumber: body.productNumber || "",
                name: body.name.trim(),
                price: price,
                description: body.description || "", // Optional
                image: body.image || "",
                category: body.category || "General", // Default
                team: body.team || "", // Optional
                sizes: body.sizes || "S,M,L,XL,2XL",
                stock: stock,
                featured: body.featured || false,
            },
        });
        return NextResponse.json(product);
    } catch (error: any) {
        console.error("Error creating product:", error);
        return NextResponse.json({
            error: "Failed to create product",
            details: error?.message || "Unknown error"
        }, { status: 500 });
    }
}
