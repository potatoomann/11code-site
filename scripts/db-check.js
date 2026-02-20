
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    try {
        console.log("Attempting to connect to database...");
        const userCount = await prisma.user.count();
        console.log(`Successfully connected! Found ${userCount} users.`);

        // Also list file size of dev.db if using sqlite
        const fs = require('fs');
        if (fs.existsSync('dev.db')) {
            const stats = fs.statSync('dev.db');
            console.log(`dev.db size: ${stats.size} bytes`);
        } else {
            console.log("dev.db file not found in current directory!");
        }

    } catch (e) {
        console.error("Database connection failed:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
