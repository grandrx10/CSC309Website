const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createSuperUser(utorid, email, password) {
    try {
        // Create the superuser in the database
        const user = await prisma.user.create({
            data: {
                utorid,
                email,
                password, // Store the plaintext password directly
                role: 'SUPERUSER', // Set the role to SUPERUSER
                verified: true, // Mark the superuser as verified
            },
        });

        console.log('Superuser created successfully:', user);
    } catch (error) {
        console.error('Error creating superuser:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Get command-line arguments
const [,, utorid, email, password] = process.argv;

// Validate arguments
if (!utorid || !email || !password) {
    console.error('Usage: node prisma/createsu.js <utorid> <email> <password>');
    process.exit(1);
}

// Run the script
createSuperUser(utorid, email, password);