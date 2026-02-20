import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const product = await prisma.product.findUnique({
            where: { id }
        });
        if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
        return NextResponse.json(product);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 });
    }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await req.json();

        const price = typeof body.price === 'string' ? parseFloat(body.price) : body.price;
        const stock = typeof body.stock === 'string' ? parseInt(body.stock) : body.stock;

        const product = await prisma.product.update({
            where: { id },
            data: {
                productNumber: body.productNumber,
                name: body.name,
                price: price,
                description: body.description,
                image: body.image,
                category: body.category,
                team: body.team,
                stock: stock,
                sizes: body.sizes,
                featured: body.featured,
            },
        });
        return NextResponse.json(product);
    } catch (error) {
        console.error("Update error:", error);
        return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        // Manually delete related items first to ensure success if DB cascade fails
        await prisma.orderItem.deleteMany({
            where: { productId: id }
        });

        await prisma.product.delete({
            where: { id }
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete error:", error);
        return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
    }
}
