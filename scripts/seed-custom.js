const { PrismaClient } = require('@prisma/client');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const prisma = new PrismaClient();

async function main() {
    console.log('Checking for Custom Jersey...');

    const exists = await prisma.product.findFirst({
        where: { name: 'Custom Team Jersey' }
    });

    if (exists) {
        console.log('✅ Product "Custom Team Jersey" already exists:', exists.id);
        return;
    }

    console.log('Seeding Custom Jersey...');

    const customProduct = await prisma.product.create({
        data: {
            name: 'Custom Team Jersey',
            price: 1999,
            description: 'Create your legacy. Fully customizable match jersey with your name and number. Features premium Heat.RDY fabric and authentic team details.',
            image: JSON.stringify({
                front: 'https://images.unsplash.com/photo-1577212017184-80cc0da11395?q=80&w=1000&auto=format&fit=crop',
                back: 'https://images.unsplash.com/photo-1522778119026-d647f0565c71?q=80&w=1000&auto=format&fit=crop',
                additional: 'https://images.unsplash.com/photo-1577212017184-80cc0da11395?q=80&w=1000&auto=format&fit=crop'
            }),
            category: 'Create Your Own',
            team: 'Custom Lab',
            stock: 999,
            sizes: 'S, M, L, XL, 2XL',
            featured: true
        }
    });

    console.log('✅ Created product:', customProduct);
}

main()
    .catch(e => {
        console.error('❌ Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
