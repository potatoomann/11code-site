const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const VINTAGE_PRODUCTS = [
    {
        id: 'cm7dcx1v4000108jz8gqr8j2d',
        name: 'Real Madrid 2002 Centenary Jersey',
        price: 129.99,
        description: 'The legendary centenary year white jersey worn by Zidane, Figo, Roberto Carlos, and Ronaldo Nazário. A masterpiece of football history featuring the iconic Siemens Mobile sponsor.',
        image: JSON.stringify({
            front: 'https://images.unsplash.com/photo-1577212017184-80cc0da11395?q=80&w=1000&auto=format&fit=crop',
            back: 'https://images.unsplash.com/photo-1522778119026-d647f0565c71?q=80&w=1000&auto=format&fit=crop',
        }),
        category: 'Retro',
        team: 'Real Madrid',
        stock: 25,
        sizes: 'M, L, XL',
        featured: true
    },
    {
        id: 'cm7dcx1v4000208jza1b62v1x',
        name: 'Barcelona 2008-09 Home Jersey',
        price: 139.99,
        description: 'The historic treble-winning season jersey under Pep Guardiola. Features the classic red and blue halves worn by Lionel Messi during his first Ballon d\'Or winning campaign.',
        image: JSON.stringify({
            front: 'https://images.unsplash.com/photo-1577212017184-80cc0da11395?q=80&w=1000&auto=format&fit=crop',
            back: 'https://images.unsplash.com/photo-1522778119026-d647f0565c71?q=80&w=1000&auto=format&fit=crop',
        }),
        category: 'Retro',
        team: 'Barcelona',
        stock: 15,
        sizes: 'S, M, L',
        featured: true
    },
    {
        id: 'cm7dcx1v4000308jz8z6v8k42',
        name: 'Brazil 2002 World Cup Jersey',
        price: 149.99,
        description: 'The iconic yellow and green jersey worn when Brazil claimed their 5th World Cup title in Yokohama. Features the classic clean design worn by Ronaldo, Rivaldo, and Ronaldinho.',
        image: JSON.stringify({
            front: 'https://images.unsplash.com/photo-1577212017184-80cc0da11395?q=80&w=1000&auto=format&fit=crop',
            back: 'https://images.unsplash.com/photo-1522778119026-d647f0565c71?q=80&w=1000&auto=format&fit=crop',
        }),
        category: 'International',
        team: 'Brazil',
        stock: 10,
        sizes: 'L, XL',
        featured: true
    },
    {
        id: 'cm7dcx1v4000408jzc1p48g3v',
        name: 'Manchester United 1998-99 Home Jersey',
        price: 159.99,
        description: 'The legendary Treble-winning zip-collar jersey. Sharp label, authentic Umbro design, worn by Beckham, Scholes, and Keane during the most historic season in English football.',
        image: JSON.stringify({
            front: 'https://images.unsplash.com/photo-1577212017184-80cc0da11395?q=80&w=1000&auto=format&fit=crop',
            back: 'https://images.unsplash.com/photo-1522778119026-d647f0565c71?q=80&w=1000&auto=format&fit=crop',
        }),
        category: 'Retro',
        team: 'Manchester United',
        stock: 5,
        sizes: 'M, L',
        featured: true
    },
    {
        id: 'cm7dcx1v4000508jza5b74c2e',
        name: 'France 1998 World Cup Home Jersey',
        price: 135.00,
        description: 'The classic blue jersey with the stark red stripe across the chest. Worn by Zinedine Zidane as he headed France to their first ever World Cup victory on home soil.',
        image: JSON.stringify({
            front: 'https://images.unsplash.com/photo-1577212017184-80cc0da11395?q=80&w=1000&auto=format&fit=crop',
            back: 'https://images.unsplash.com/photo-1522778119026-d647f0565c71?q=80&w=1000&auto=format&fit=crop',
        }),
        category: 'International',
        team: 'France',
        stock: 8,
        sizes: 'S, M, L, XL',
        featured: true
    }
];

async function main() {
    console.log('Starting Prisma seed process...');

    for (const product of VINTAGE_PRODUCTS) {
        const exists = await prisma.product.findFirst({
            where: { name: product.name }
        });

        if (!exists) {
            await prisma.product.create({
                data: product
            });
            console.log(`✅ Seeded: ${product.name}`);
        } else {
            console.log(`⏩ Skipped: ${product.name} (Already exists)`);
        }
    }

    console.log('Seeding finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
