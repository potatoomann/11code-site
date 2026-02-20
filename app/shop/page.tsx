import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import ShopClient from "@/components/ShopClient";

// Force dynamic rendering to ensure fresh data
export const dynamic = 'force-dynamic';

async function getProducts() {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' }
    });

    // Pass plain objects to client component
    const serialized = JSON.parse(JSON.stringify(products));
    console.log(`Fetched ${serialized.length} products on server`);
    return serialized;
  } catch (error) {
    console.error("Failed to fetch products:", error);
    return [];
  }
}

export default async function Shop() {
  const products = await getProducts();

  return (
    <Suspense fallback={<div className="min-h-screen pt-24 text-center">Loading...</div>}>
      <ShopClient initialProducts={products} />
    </Suspense>
  );
}
