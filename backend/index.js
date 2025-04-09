#!/usr/bin/env node
'use strict';

const port = process.env.PORT || 3100;
require('dotenv').config()
const express = require("express");
const app = express();
app.use(express.json());
const multer = require('multer');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const cors = require("cors");
app.use(cors());

// {
//     origin: process.env.FRONTEND_URL || "http://localhost:3000", //"https://csc309website-production.up.railway.app",
//     methods: "GET,POST,PUT,DELETE,PATCH,OPTIONS", 
//     credentials: true, 
// }

// For keeping track of last request
const requestTimestamps = {};

const jwt_secret = process.env.JWT_SECRET || "SuperSecretKey!"
app.get('/api/hello', (req, res) => {
    res.json({ message: "Hello from Railway backend!" });
  });
// Authentication Middleware
const authenticateUser = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1]; // Get the token from the Authorization header
    if (!token) {
        return res.status(401).json({ error: 'authentication required' });
    }

    try {
        const decoded = jwt.verify(token, jwt_secret); // Verify the token
        req.user = decoded; // Attach the decoded user information to the request object
        next();
    } catch (err) {
        res.status(401).json({ error: 'invalid or expired token' });
    }
};

// Validate Promotions
const validatePromotions = async (userId, promotionIds) => {
    const promotions = [];
    for (const promotionId of promotionIds) {
        const promotion = await prisma.promotion.findUnique({
            where: { id: promotionId },
        });

        if (!promotion) {
            throw new Error(`promotion with ID ${promotionId} does not exist`);
        }

        const usage = await prisma.usage.findFirst({
            where: {
                userId,
                promotionId: promotion.id,
            },
        });

        if (usage) {
            throw new Error(`promotion with ID ${promotionId} has already been used`);
        }

        promotions.push(promotion);
    }
    return promotions;
};

// DISK STORAGE MANAGEMENT
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, 'uploads/avatars');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true }); // Create the directory if it doesn't exist
        }
        cb(null, uploadDir); // Save files to the uploads/avatars directory
    },
    filename: (req, file, cb) => {
        const userId = req.user.userId; // Assuming authentication middleware attaches the user ID
        const ext = path.extname(file.originalname); // Get the file extension
        cb(null, `${userId}${ext}`); // Save the file as <userId>.<ext>
    },
});

const upload = multer({ storage });

// CLEARANCE MIDDLEWARE
const isRegularOrHigher = (req, res, next) => {
    const userRole = req.user.role.toUpperCase(); // Assuming authentication middleware attaches the user role
    if (['USER', 'REGULAR', 'CASHIER', 'MANAGER', 'SUPERUSER'].includes(userRole)) {
        next(); // User has clearance, proceed to the next middleware/route handler
    } else {
        console.log("userRole: " + userRole + " but needed: Regular or higher");
        res.status(403).json({ error: 'only regular or higher have access.' });
    }
};

const isCashierOrHigher = (req, res, next) => {
    const userRole = req.user.role.toUpperCase(); // Assuming authentication middleware attaches the user role
    if (['CASHIER', 'MANAGER', 'SUPERUSER'].includes(userRole)) {
        next(); // User has clearance, proceed to the next middleware/route handler
    } else {
        console.log("userRole: " + userRole + " but needed: cashier or higher");
        res.status(403).json({ error: 'only cashiers or higher have access.' });
    }
};

const isManagerOrHigher = (req, res, next) => {
    const userRole = req.user.role.toUpperCase(); // Assuming authentication middleware attaches the user role
    if (['MANAGER', 'SUPERUSER'].includes(userRole)) {
        next(); // User has clearance, proceed to the next middleware/route handler
    } else {
        console.log("userRole: " + userRole + " but needed: manager or higher");
        res.status(403).json({ error: 'only managers or higher have access.' });
    }
};

// API BEGINS
app.post('/users', authenticateUser, isCashierOrHigher, async (req, res) => {
    const { utorid, name, email } = req.body;

    if (!utorid || !name || !email) {
        return res.status(400).json({ error: 'utorid, name, email, and password are required' });
    }

    // Validate utorid length
    if (utorid.length !== 8) {
        return res.status(400).json({ error: 'utorid must be exactly 8 characters' });
    }

    // Validate name length
    if (name.length < 1 || name.length > 50) {
        return res.status(400).json({ error: 'name must be between 1 and 50 characters' });
    }

    // Validate email format (University of Toronto email)
    const emailRegex = /^[^\s@]+@mail\.utoronto\.ca$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'email must be a valid University of Toronto email' });
    }

    try {
        // Check if a user with the same utorid or email already exists
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { utorid },
                    { email },
                ],
            },
        });

        if (existingUser) {
            return res.status(409).json({ error: 'user with the same utorid or email already exists' });
        }

        // Generate resetToken and set expiresAt (7 days from now)
        const resetToken = uuidv4();
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

        // Create the user
        const user = await prisma.user.create({
            data: {
                utorid,
                name,
                email, // Store the plaintext password (as per your requirement)
                points: 0, // Default points
                verified: false, // Default verified status
                resetToken,
                lastLogin: null,
                expiresAt,
            },
        });

        // Respond with the created user (excluding sensitive fields like password)
        res.status(201).json({
            id: user.id,
            utorid: user.utorid,
            name: user.name,
            email: user.email,
            verified: user.verified,
            expiresAt: user.expiresAt,
            resetToken: user.resetToken,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'user creation failed' });
    }
});

app.get('/users', authenticateUser, isManagerOrHigher, async (req, res) => {
    const { name, role, verified, activated } = req.query;

    // Parse and validate page and limit
    let page = parseInt(req.query.page, 10) || 1; // Default to page 1
    let limit = parseInt(req.query.limit, 10) || 10; // Default to 10 users per page

    // Ensure page and limit are valid
    if (page < 1) { return res.status(400).json({ err: "DONT DO THAT!" }) };
    if (limit < 1) { return res.status(400).json({ err: "DONT DO THAT!" }) };

    try {
        // Build the filter object
        const filters = {};

        // Filter by name (utorid or name)
        if (name) {
            filters.OR = [
                { name: { contains: name } },
                { utorid: { contains: name.toLowerCase() } },
            ];
        }

        // Filter by role
        if (role) {
            filters.role = role.toUpperCase(); // Assuming roles are stored in uppercase
        }

        // Filter by verified status
        if (verified != null) {  // Changed from `null` to `null`
            filters.verified = verified === 'true';
        }

        // Filter by activated status (whether the user has ever logged in)
        if (activated != null) {  // Changed from `null` to `null`
            if (activated === 'true') {
                filters.lastLogin = { not: null };
            } else {
                filters.lastLogin = null;
            }
        }
        // Get the total count of users matching the filters
        const count = await prisma.user.count({ where: filters });
        // Get the paginated list of users
        const users = await prisma.user.findMany({
            where: filters,
            skip: (page - 1) * limit, // Calculate the offset
            take: limit, // Number of users per page
            select: {
                id: true,
                utorid: true,
                name: true,
                email: true,
                birthday: true,
                role: true,
                points: true,
                createdAt: true,
                lastLogin: true,
                verified: true,
                avatarUrl: true,
            },
            orderBy: {
                createdAt: 'desc', // Sort by most recently created first
            },
        });

        // Format date fields for consistent output
        const formattedUsers = users.map(user => ({
            ...user,
            birthday: user.birthday ? user.birthday.toISOString().split('T')[0] : null,
            createdAt: user.createdAt.toISOString(),
            lastLogin: user.lastLogin ? user.lastLogin.toISOString() : null,
            role: user.role
                ? user.role.toLowerCase().replace(/^./, (char) => char.toUpperCase())
                : user.role
        }));
        return res.status(200).json({
            count,
            results: formattedUsers,
        });
    } catch (err) {
        console.error('Error retrieving users:', err);
        return res.status(500).json({ error: 'failed to retrieve users' });
    }
});

app.patch('/users/me', authenticateUser, isRegularOrHigher, upload.single('avatar'), async (req, res) => {
    const { name, email, birthday } = req.body;
    const userId = req.user.userId;

    if (!name && !email && !birthday && !req.file) {
        return res.status(400).json({ error: 'Payload cannot be empty' });
    }

    try {
        // Validate name length
        if (name && (name.length < 1 || name.length > 50)) {
            console.log("name bad")
            return res.status(400).json({ error: 'name must be between 1 and 50 characters' });
        }

        // Validate email format (UofT email)
        if (email !== null) {
            if (!email || !email.trim()) {
                console.log("email bad")
                return res.status(400).json({ error: 'email cannot be empty' });
            }
            if (!/^[^\s@]+@mail\.utoronto\.ca$/.test(email)) {
                console.log("email not uoft")
                return res.status(400).json({ error: 'email must be a valid University of Toronto email' });
            }
        }

        // Validate birthday format and check if it's a real date
        if (birthday) {
            if (!/^\d{4}-\d{2}-\d{2}$/.test(birthday)) {
                console.log("birthday bad")
                return res.status(400).json({ error: 'birthday must be in the format YYYY-MM-DD' });
            }

            const [year, month, day] = birthday.split('-').map(Number);
            const date = new Date(`${year}-${month}-${day}`);

            // Check if date is valid and matches the input
            if (
                date.getFullYear() !== year ||
                date.getMonth() + 1 !== month ||
                date.getDate() !== day
            ) {
                console.log("birthday doesnt exist")
                return res.status(400).json({ error: 'birthday must be a valid date' });
            }
        }


        // Prepare the update data
        const updateData = {};
        if (name !== null) updateData.name = name;
        if (email !== null && email.trim()) updateData.email = email.trim();
        if (birthday !== null) updateData.birthday = new Date(birthday);

        // Handle avatar file upload
        if (req.file) {
            const avatarUrl = `/uploads/avatars/${req.file.filename}`;
            updateData.avatarUrl = avatarUrl;
        }

        // Update the user
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true,
                utorid: true,
                name: true,
                email: true,
                birthday: true,
                role: true,
                points: true,
                createdAt: true,
                lastLogin: true,
                verified: true,
                avatarUrl: true,
            },
        });

        // Format the response to ensure all date fields are strings
        const formattedUser = {
            ...updatedUser,
            birthday: updatedUser.birthday ? updatedUser.birthday.toISOString().split('T')[0] : null,
            createdAt: updatedUser.createdAt.toISOString(),
            lastLogin: updatedUser.lastLogin ? updatedUser.lastLogin.toISOString() : "",
        };

        // Respond with the updated user
        res.status(200).json(formattedUser);
    } catch (err) {
        console.error(err);
        console.log(req.body);

        // Handle unique constraint violations (e.g., duplicate email)
        if (err.code === 'P2002') {
            return res.status(400).json({ error: 'email already in use' });
        }

        res.status(500).json({ error: 'failed to update user' });
    }
});


app.get('/users/me', authenticateUser, isRegularOrHigher, async (req, res) => {
    const userId = req.user.userId; // Assuming authentication middleware attaches the user ID
    try {
        // Find the user
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                utorid: true,
                name: true,
                email: true,
                birthday: true,
                role: true,
                points: true,
                createdAt: true,
                lastLogin: true,
                verified: true,
                avatarUrl: true,
            },
        });

        if (!user) {
            return res.status(404).json({ error: 'user not found' });
        }

        // Find one-time promotions that the user has not used yet
        const availablePromotions = await prisma.promotion.findMany({
            where: {
                isOneTime: true, // Only one-time promotions
                usages: {
                    none: {
                        userId: userId, // Promotions not used by this user
                    },
                },
            },
            select: {
                id: true,
                name: true,
                minSpending: true,
                rate: true,
                points: true,
            },
        });

        // Respond with the user and available promotions
        res.status(200).json({
            ...user,
            promotions: availablePromotions,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'failed to retrieve user' });
    }
});

app.patch('/users/me/password', authenticateUser, isRegularOrHigher, async (req, res) => {
    const { old: oldPassword, new: newPassword } = req.body;
    const userId = req.user.userId;
    if (!oldPassword || !newPassword) {
        return res.status(400).json({ error: "invalid package" });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { password: true }
        })

        if (!user) {
            return res.status(404).json({ error: 'user not found' });
        }
        if (oldPassword !== user.password) {
            return res.status(403).json({ error: 'incorrect current password' });
        }
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,20}$/;
        if (!passwordRegex.test(newPassword)) {
            return res.status(400).json({
                error: 'new password must be 8-20 characters, with at least one uppercase, one lowercase, one number, and one special character',
            });
        }

        await prisma.user.update({
            where: { id: userId },
            data: { password: newPassword }, // Update the password (plaintext, as per your requirement)
        });

        res.status(200).json({ message: 'password updated successfully' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'failed to update password' });
    }
});

app.get('/users/:userId', authenticateUser, async (req, res) => {
    const { userId } = req.params;
    const { role } = req.user; // Get the role of the authenticated user
    // Validate userId
    if (role.toUpperCase() !== "CASHIER" && role.toUpperCase() !== "MANAGER" && role.toUpperCase() !== "SUPERUSER") {
        return res.status(403).json({ error: "Access forbidden. Only CASHIER and MANAGER roles are allowed." });
    }

    if (isNaN(userId)) {
        return res.status(400).json({ error: "userId must be a valid number." });
    }

    try {
        // Define the base select fields for all roles
        const baseSelect = {
            id: true,
            utorid: true,
            name: true,
            points: true,
            verified: true,
        };

        // Define additional select fields for MANAGER or higher
        const managerSelect = {
            email: true,
            birthday: true,
            role: true,
            createdAt: true,
            lastLogin: true,
            avatarUrl: true,
        };

        // Combine select fields based on the user's role
        const selectFields = role === "CASHIER" ? baseSelect : { ...baseSelect, ...managerSelect };

        // Retrieve the user
        const user = await prisma.user.findUnique({
            where: { id: parseInt(userId) },
            select: selectFields,
        });

        if (!user) {
            return res.status(404).json({ error: "User not found." });
        }

        // Retrieve one-time promotions that the user has not used yet
        const availablePromotions = await prisma.promotion.findMany({
            where: {
                isOneTime: true, // Only one-time promotions
                usages: {
                    none: {
                        userId: parseInt(userId), // Promotions not used by this user
                    },
                },
            },
            select: {
                id: true,
                name: true,
                minSpending: true,
                rate: true,
                points: true,
            },
        });

        // Respond with the user and available promotions
        return res.status(200).json({
            ...user,
            promotions: availablePromotions,
        });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: "Failed to retrieve user" });
    }
});

app.patch('/users/:userId', authenticateUser, isManagerOrHigher, async (req, res) => {
    const { email, verified, suspicious, role } = req.body;
    const { userId } = req.params;
    const userRole = req.user.role.toLowerCase();

    const parsedUserId = parseInt(userId);
    if (isNaN(parsedUserId)) {
        return res.status(400).json({ error: "userId must be a valid number." });
    }

    if ((email === null) && (verified === null) && (suspicious === null) && (role === null)) {
        return res.status(400).json({ error: "At least one field (email, verified, suspicious, or role) must be provided." });
    }

    const toBoolean = (value) => {
        if (typeof value === 'boolean') return value;
        if (typeof value === 'string') {
            if (value.toLowerCase() === 'true') return true;
            if (value.toLowerCase() === 'false') return false;
        }
        return null;
    };

    try {
        const updateData = {};

        if (email !== null) {
            if (typeof email !== 'string' || !email.trim()) {
                return res.status(400).json({ error: 'email must be a non-empty string' });
            }
            if (!email.endsWith('@mail.utoronto.ca')) {
                return res.status(400).json({ error: 'email must be a @mail.utoronto.ca address' });
            }
            updateData.email = email;
        }

        if (verified !== null) {
            const verifiedBool = toBoolean(verified);
            if (verifiedBool === null) {
                return res.status(400).json({ error: 'verified must be a boolean or a string ("true" or "false")' });
            }

            if (verifiedBool == false) {
                return res.status(400).json({ error: 'you can not unverify users!' });
            }
            updateData.verified = verifiedBool;
        }

        if (role !== null) {
            const normalizedRole = role.toLowerCase();
            const validRoles = ["regular", "cashier", "manager", "superuser"];
            if (!validRoles.includes(normalizedRole)) {
                return res.status(400).json({ error: 'Invalid role. Must be one of "regular", "cashier", "manager", or "superuser".' });
            }
            if (userRole === "manager" && !["cashier", "regular"].includes(normalizedRole)) {
                return res.status(403).json({ error: 'Managers can only assign "cashier" or "regular" roles.' });
            }
            updateData.role = normalizedRole.toUpperCase();
            if (normalizedRole === 'cashier') {
                updateData.suspicious = false;
            }
        }

        if (suspicious !== null) {

            const suspiciousBool = toBoolean(suspicious);
            if (suspiciousBool === null) {
                return res.status(400).json({ error: 'suspicious must be a boolean or a string ("true" or "false")' });
            }
            updateData.suspicious = suspiciousBool;
        }

        const updatedUser = await prisma.user.update({
            where: { id: parsedUserId },
            data: updateData,
            select: {
                id: true,
                utorid: true,
                name: true,
                ...(email !== null && { email: true }),
                ...(verified !== null && { verified: true }),
                ...(suspicious !== null && { suspicious: true }),
                ...(role !== null && { role: true }),
            },
        });

        return res.status(200).json({
            ...updatedUser,
            ...(updatedUser.role && { role: updatedUser.role.toUpperCase() })
        });
    } catch (err) {
        console.error(err);
        if (err.code === 'P2025') {
            return res.status(404).json({ error: 'user not found' });
        }
        return res.status(500).json({ error: 'failed to update user' });
    }
});


// AUTHORIZATION TOKENS
app.post('/auth/tokens', async (req, res) => {
    const { utorid, password } = req.body;
    if (!utorid || !password) {
        return res.status(400).json({ error: 'utorid and password are required' });
    }

    try {
        // Find the user by UTORid
        const user = await prisma.user.findUnique({
            where: { utorid },
        });

        if (!user || password !== user.password) { // Assuming passwords are stored in plaintext
            return res.status(401).json({ error: 'invalid utorid or password' });
        }

        await prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() },
        });
        const token = jwt.sign(
            { userId: user.id, role: user.role, utorid: utorid, points: user.points, name: user.name, suspicious: user.suspicious }, // Payload
            jwt_secret, // Secret key (store this in environment variables)
            { expiresIn: '1h' } // Token expiration time
        );

        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

        // Respond with the token and expiration time
        return res.status(200).json({
            token,
            expiresAt: expiresAt.toISOString(),
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'failed to authenticate user' });
    }
});

app.post('/auth/resets', async (req, res) => {
    const { utorid } = req.body;
    const clientIp = req.ip;

    if (!utorid) {
        return res.status(400).json({ error: 'utorid is required' });
    }

    try {
        // Find the user by UTORid
        const user = await prisma.user.findUnique({
            where: { utorid },
        });

        if (!user) {
            return res.status(404).json({
                expiresAt: null,
                resetToken: null
            });
        }
        const lastRequestTime = requestTimestamps[clientIp];

        // Update the request timestamp for the IP
        requestTimestamps[clientIp] = Date.now();

        if (lastRequestTime && Date.now() - lastRequestTime < 60 * 1000) {
            return res.status(429).json({ error: 'too many requests' });
        }

        // Generate a reset token and set its expiration time (e.g., 1 hour from now)
        const resetToken = uuidv4();
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

        // Update the user's resetToken and expiresAt fields
        await prisma.user.update({
            where: { id: user.id },
            data: { resetToken, expiresAt },
        });

        // Respond with the reset token and expiration time
        return res.status(202).json({
            expiresAt: expiresAt.toISOString(),
            resetToken,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'failed to process password reset request' });
    }
});

app.post('/auth/resets/:resetToken', async (req, res) => {
    const { resetToken } = req.params;
    const { utorid, password } = req.body;

    // Validate the payload
    if (!utorid || !password) {
        return res.status(400).json({
            error: 'utorid and password are required',
            expiresAt: null,
            resetToken: null,
        });
    }

    // Validate the new password
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,20}$/;
    if (!passwordRegex.test(password)) {
        return res.status(400).json({
            error: 'password must be 8-20 characters, with at least one uppercase, one lowercase, one number, and one special character',
            expiresAt: null,
            resetToken: null,
        });
    }

    try {
        // Find the user by UTORid
        const user = await prisma.user.findUnique({
            where: { utorid },
        });

        const reset_token = await prisma.user.findUnique({
            where: { resetToken }
        });

        if (!reset_token) {
            return res.status(404).json({
                error: 'resetToken not found',
                expiresAt: null,
                resetToken: null,
            });
        }

        // If no user is found, return 404 (Not Found)
        if (!user) {
            return res.status(404).json({
                error: 'user not found',
                expiresAt: null,
                resetToken: null,
            });
        }

        // Check if the resetToken matches the user's resetToken
        if (user.resetToken !== resetToken) {
            return res.status(401).json({
                error: 'reset token does not match utorid',
                expiresAt: null,
                resetToken: null,
            });
        }

        // Check if the resetToken has expired
        if (user.expiresAt < new Date()) {
            return res.status(401).json({
                error: 'reset token expired',
                expiresAt: null,
                resetToken: null,
            });
        }

        // Update the user's password and clear the resetToken and expiresAt fields
        await prisma.user.update({
            where: { id: user.id },
            data: {
                password, // Update the password (plaintext, as per your requirement)
                resetToken: null, // Clear the reset token
                expiresAt: null, // Clear the expiration time
            },
        });

        // Respond with success
        res.status(200).json({
            message: 'password reset successfully',
            expiresAt: null,
            resetToken: null,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: 'failed to reset password',
            expiresAt: null,
            resetToken: null,
        });
    }
});

// TRANSACTION API
app.post('/transactions', authenticateUser, async (req, res) => {
    const { utorid, type, spent, amount, relatedId, remark = '' } = req.body;
    const createdBy = req.user.utorid;
    const userRole = req.user.role.toUpperCase();

    const promotionIds = typeof req.body.promotionIds === 'string'
        ? req.body.promotionIds.split(',').map(Number)
        : Array.isArray(req.body.promotionIds)
            ? req.body.promotionIds
            : [];

    try {
        if (type !== 'purchase' && type !== 'adjustment') {
            return res.status(400).json({ error: 'type must be "purchase" or "adjustment"' });
        }

        // Authorization checks
        if (type === 'purchase' && !['CASHIER', 'MANAGER', 'SUPERUSER'].includes(userRole)) {
            return res.status(403).json({ error: 'insufficient clearance for purchase transactions' });
        }
        if (type === 'adjustment' && !['MANAGER', 'SUPERUSER'].includes(userRole)) {
            return res.status(403).json({ error: 'insufficient clearance for adjustment transactions' });
        }

        const user = await prisma.user.findUnique({ where: { utorid } });
        if (!user) return res.status(400).json({ error: 'user not found' });

        // Validate promotions
        const promotions = [];
        for (const promotionId of promotionIds) {
            const promotion = await prisma.promotion.findUnique({ where: { id: promotionId } });
            if (!promotion) return res.status(400).json({ error: `promotion ${promotionId} not found` });

            const usage = await prisma.usage.findFirst({
                where: { userId: user.id, promotionId: promotion.id },
            });
            if (usage) return res.status(400).json({ error: `promotion ${promotionId} already used` });

            promotions.push(promotion);
        }

        let transaction;

        if (type === 'purchase') {
            if (typeof spent !== 'number' || spent <= 0) {
                return res.status(400).json({ error: 'spent must be a positive number' });
            }

            // Calculate earned points
            let earnedPoints = Math.round(spent / 0.25);
            for (const promotion of promotions) {
                earnedPoints += promotion.points || 0; // Add promotion points
            }

            // Create transaction with amount instead of earned
            transaction = await prisma.transaction.create({
                data: {
                    utorid,
                    type,
                    spent,
                    amount: earnedPoints, // Correct field name
                    remark,
                    createdBy,
                    suspicious: req.user.suspicious,
                    promotions: { connect: promotions.map(p => ({ id: p.id })) },
                },
                include: { promotions: true },
            });

            // Update user points only if cashier is not suspicious

            if (!req.user.suspicious) {
                await prisma.user.update({
                    where: { id: user.id },
                    data: { points: user.points + earnedPoints },
                });
            }
        } else if (type === 'adjustment') {
            if (typeof amount !== 'number') {
                return res.status(400).json({ error: 'amount must be a number' });
            }

            const relatedTransaction = await prisma.transaction.findUnique({
                where: { id: parseInt(relatedId, 10), },
            });

            if (!relatedTransaction) {
                return res.status(404).json({ error: 'related transaction not found' });
            }

            transaction = await prisma.transaction.create({
                data: {
                    utorid,
                    type,
                    amount,
                    relatedId: parseInt(relatedId, 10),
                    spent: 0,
                    earned: 0,
                    remark,
                    createdBy,
                    promotions: { connect: promotions.map((promotion) => ({ id: promotion.id })) },
                },
                include: { promotions: true },
            });


            await prisma.user.update({
                where: { id: user.id },
                data: { points: user.points + amount },
            });
        }

        // Record promotion usage
        for (const promotion of promotions) {
            await prisma.usage.create({
                data: { userId: user.id, promotionId: promotion.id },
            });
        }
        // Format response
        const response = {
            id: transaction.id,
            utorid: transaction.utorid,
            type: transaction.type,
            ...(type === 'purchase' ? {
                spent: transaction.spent,
                earned: req.user.suspicious ? 0 : transaction.amount
            } : {
                amount: transaction.amount,
                relatedId: transaction.relatedId
            }),
            remark: transaction.remark,
            promotionIds: (transaction.promotions || []).map(p => p.id), // Handle undefined case
            createdBy: transaction.createdBy,
        };
        res.status(201).json(response);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'failed to create transaction' });
    }
});
app.get('/transactions', authenticateUser, isManagerOrHigher, async (req, res) => {
    const { name, createdBy, suspicious, promotionId, type, relatedId, amount, operator, page = 1, limit = 10 } = req.query;
    try {
        // Build the filter object
        const filters = {};

        // Filter by name
        if (name) {
            filters.utorid = { contains: name.toLowerCase() };
        }

        // Filter by createdBy
        if (createdBy) {
            filters.createdBy = createdBy;
        }

        // Filter by suspicious
        if (suspicious !== null && suspicious !== undefined) {
            filters.suspicious = suspicious === 'true';
        }

        // Filter by promotionId
        if (promotionId && promotionId !== undefined) {
            filters.promotions = { some: { id: parseInt(promotionId) } };
        }

        // Filter by type
        if (type && type !== undefined) {
            filters.type = type;
        }

        // Filter by relatedId (must be used with type)
        if (relatedId && relatedId !== undefined) {
            if (!type) {
                return res.status(400).json({ error: 'relatedId must be used with type' });
            }
            filters.relatedId = parseInt(relatedId);
        }

        // Filter by amount (must be used with operator)
        if (amount !== null && amount !== undefined) {
            if (!operator || !['gte', 'lte'].includes(operator)) {
                return res.status(400).json({ error: 'operator must be "gte" or "lte" when filtering by amount' });
            }
            filters.amount = { [operator]: parseFloat(amount) };
        }

        // Get the total count of transactions matching the filters
        const count = await prisma.transaction.count({ where: filters });

        // Get the paginated list of transactions
        const transactions = await prisma.transaction.findMany({
            where: filters,
            skip: (page - 1) * limit,
            take: parseInt(limit),
            include: {
                promotions: {
                    select: {
                        id: true,
                    },
                },
                /* user: {
                    select: {
                        name: true
                    }
                } */
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Format the response
        const results = transactions.map((transaction) => {
            const baseResponse = {
                id: transaction.id,
                utorid: transaction.utorid,
                amount: transaction.amount, // Always return the actual amount
                type: transaction.type,
                spent: transaction.spent,
                promotionIds: transaction.promotions.map((promotion) => promotion.id),
                suspicious: transaction.suspicious,
                remark: transaction.remark,
                createdBy: transaction.createdBy,
                createdAt: transaction.createdAt,
                name: transaction.user?.name || null
            };

            // Include relatedId for specific types
            if (['adjustment', 'transfer', 'redemption', 'event']
                .includes(transaction.type.toLowerCase())) {
                baseResponse.relatedId = transaction.relatedId;
            }

            // For redemptions, include redeemed as a positive value
            if (transaction.type.toLowerCase() === 'redemption') {
                baseResponse.redeemed = Math.abs(transaction.amount);
            }

            return baseResponse;
        });

        // Respond with the count and results
        res.status(200).json({
            count,
            results,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'failed to retrieve transactions' });
    }
});
app.patch('/transactions/:transactionId/suspicious', authenticateUser, isManagerOrHigher, async (req, res) => {
    const { transactionId } = req.params;
    const { suspicious } = req.body;

    try {
        // Find the transaction by ID
        const transaction = await prisma.transaction.findUnique({
            where: { id: parseInt(transactionId) },
            include: {
                promotions: {
                    select: {
                        id: true,
                    },
                },
            },
        });

        if (!transaction) {
            return res.status(404).json({ error: 'transaction not found' });
        }

        // Find the user associated with the transaction
        const user = await prisma.user.findUnique({
            where: { utorid: transaction.utorid },
        });

        if (!user) {
            return res.status(404).json({ error: 'user not found' });
        }

        // Calculate the new points balance
        let newPoints = user.points;
        if (suspicious && !transaction.suspicious) {
            // Marking as suspicious: deduct the amount
            newPoints = Math.max(0, user.points - transaction.amount); // Prevent negative points
        } else if (!suspicious && transaction.suspicious) {
            // Marking as not suspicious: credit the amount
            newPoints = user.points + transaction.amount;
        }

        // Use a transaction to ensure both updates succeed or fail together
        const [updatedTransaction] = await prisma.$transaction([
            prisma.transaction.update({
                where: { id: parseInt(transactionId) },
                data: {
                    suspicious,
                    amount: Math.round(newPoints) // Now updating `amount` in the transaction
                },
                include: {
                    promotions: {
                        select: { id: true },
                    },
                },
            }),
            prisma.user.update({
                where: { utorid: transaction.utorid },
                data: { points: Math.round(newPoints) }, // Still ensuring points stay updated in the user table
            })
        ]);

        // Format the response
        const response = {
            id: updatedTransaction.id,
            utorid: updatedTransaction.utorid,
            type: updatedTransaction.type,
            spent: updatedTransaction.spent,
            amount: updatedTransaction.amount,
            promotionIds: updatedTransaction.promotions.map((promotion) => promotion.id),
            suspicious: updatedTransaction.suspicious,
            remark: updatedTransaction.remark,
            createdBy: updatedTransaction.createdBy,
        };

        // Respond with the updated transaction
        res.status(200).json(response);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'failed to update transaction suspicious flag' });
    }
});

app.get('/transactions/:transactionId', authenticateUser, isManagerOrHigher, async (req, res) => {
    const { transactionId } = req.params;
    try {
        // Find the transaction by ID
        const transaction = await prisma.transaction.findUnique({
            where: { id: parseInt(transactionId) },
            include: {
                promotions: {
                    select: {
                        id: true,
                    },
                },
            },
        });

        if (!transaction) {
            return res.status(404).json({ error: 'transaction not found' });
        }

        // Format the response
        const response = {
            id: transaction.id,
            utorid: transaction.utorid,
            type: transaction.type,
            spent: transaction.spent,
            amount: transaction.amount,
            relatedId: transaction.relatedId,
            promotionIds: transaction.promotions.map((promotion) => promotion.id),
            suspicious: transaction.suspicious,
            remark: transaction.remark,
            createdBy: transaction.createdBy,
        };

        // Respond with the transaction details
        res.status(200).json(response);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'failed to retrieve transaction' });
    }
});

// SELF TRANSACTIONS
app.post('/users/me/transactions', authenticateUser, isRegularOrHigher, async (req, res) => {
    const { type, amount, remark = '' } = req.body;
    const userId = req.user.userId;
    const utorid = req.user.utorid; // Access the authenticated user's UTORid

    try {
        // Validate the transaction type
        if (type !== 'redemption') {
            return res.status(400).json({ error: 'type must be "redemption"' });
        }

        // Validate the amount (if provided)
        if (amount !== null) {
            if (typeof amount !== 'number' || amount <= 0 || !Number.isInteger(amount)) {
                return res.status(400).json({ error: 'amount must be a positive integer' });
            }
        }

        // Find the user
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            return res.status(404).json({ error: 'user not found' });
        }

        // Check if the user is verified
        if (!user.verified) {
            return res.status(403).json({ error: 'user is not verified' });
        }

        // Check if the requested amount exceeds the user's point balance
        if (amount !== null && user.points < amount) {
            return res.status(400).json({ error: 'requested amount exceeds user point balance' });
        }

        // Create the redemption transaction
        const transaction = await prisma.transaction.create({
            data: {
                utorid,
                type: 'redemption',
                amount: amount || 0, // Use 0 if amount is not provided
                remark,
                createdBy: utorid,
                processedBy: null, // Initially unprocessed
            },
        });

        // Respond with the created transaction
        res.status(201).json({
            id: transaction.id,
            utorid: transaction.utorid,
            type: transaction.type,
            processedBy: transaction.processedBy,
            amount: transaction.amount,
            remark: transaction.remark,
            createdBy: transaction.createdBy,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'failed to create redemption transaction' });
    }
})

app.get('/users/me/transactions', authenticateUser, isRegularOrHigher, async (req, res) => {
    const {
        type,
        relatedId,
        promotionId,
        amount,
        operator,
        page = 1,
        limit = 10,
    } = req.query;
    const userId = req.user.userId; // Access the authenticated user's ID

    try {
        // Build the filter object
        const filters = { utorid: req.user.utorid }; // Only include transactions owned by the user

        // Filter by type
        if (type) {
            filters.type = type;
        }

        // Filter by relatedId (must be used with type)
        if (relatedId) {
            if (!type) {
                return res.status(400).json({ error: 'relatedId must be used with type' });
            }
            filters.relatedId = parseInt(relatedId);
        }

        // Filter by promotionId
        if (promotionId) {
            filters.promotions = { some: { id: parseInt(promotionId) } };
        }

        // Filter by amount (must be used with operator)
        if (amount !== null) {
            if (!operator || !['gte', 'lte'].includes(operator)) {
                return res.status(400).json({ error: 'operator must be "gte" or "lte" when filtering by amount' });
            }
            filters.amount = { [operator]: parseFloat(amount) };
        }

        // Get the total count of transactions matching the filters
        const count = await prisma.transaction.count({ where: filters });

        // Get the paginated list of transactions
        const transactions = await prisma.transaction.findMany({
            where: filters,
            skip: (page - 1) * limit, // Calculate the offset
            take: parseInt(limit), // Number of transactions per page
            include: {
                promotions: {
                    select: {
                        id: true,
                    },
                },
            },
        });

        // Format the response
        const results = transactions.map((transaction) => ({
            id: transaction.id,
            type: transaction.type,
            spent: transaction.spent,
            amount: transaction.amount,
            promotionIds: transaction.promotions.map((promotion) => promotion.id),
            remark: transaction.remark,
            createdBy: transaction.createdBy,
            ...(transaction.type === 'adjustment' || transaction.type === 'transfer' || transaction.type === 'redemption'
                ? { relatedId: transaction.relatedId }
                : {}),
        }));

        // Respond with the count and results
        res.status(200).json({
            count,
            results,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'failed to retrieve transactions' });
    }
});

app.post('/users/:userId/transactions', authenticateUser, isRegularOrHigher, async (req, res) => {
    const { userId } = req.params;
    const { type, amount, remark = '' } = req.body;
    const senderUtorid = req.user.utorid; // Assuming authentication middleware attaches the sender's UTORid
    const senderId = req.user.userId; // Assuming authentication middleware attaches the sender's ID

    try {
        // Validate the transaction type
        if (type !== 'transfer') {
            return res.status(400).json({ error: 'type must be "transfer"' });
        }

        // Validate the amount
        if (typeof amount !== 'number' || amount <= 0 || !Number.isInteger(amount)) {
            console.log("must be positive intedger");
            return res.status(400).json({ error: 'amount must be a positive integer' });
        }

        // Find the sender (current logged-in user)
        const sender = await prisma.user.findUnique({
            where: { id: senderId },
        });

        if (!sender) {
            return res.status(404).json({ error: 'sender not found' });
        }

        // Check if the sender is verified
        if (!sender.verified) {
            return res.status(403).json({ error: 'sender is not verified' });
        }

        // Check if the sender has enough points
        // console.log("Sender Points:");
        // console.log(sender.points);
        // console.log("Current amount requested: ");
        // console.log(amount);
        if (sender.points < amount) {
            console.log("Not enough points");
            return res.status(400).json({ error: 'sender does not have enough points' });
        }

        // Find the recipient
        const recipient = await prisma.user.findUnique({
            where: { id: parseInt(userId) },
        });

        if (!recipient) {
            return res.status(404).json({ error: 'recipient not found' });
        }

        // Deduct points from the sender
        await prisma.user.update({
            where: { id: senderId },
            data: { points: sender.points - amount },
        });

        // Credit points to the recipient
        await prisma.user.update({
            where: { id: parseInt(userId) },
            data: { points: recipient.points + amount },
        });

        // Create the sender's transaction
        const senderTransaction = await prisma.transaction.create({
            data: {
                utorid: sender.utorid,
                type: 'transfer',
                amount: -amount, // Deduct points
                relatedId: parseInt(userId), // Recipient's user ID
                remark,
                createdBy: senderUtorid,
            },
        });

        // Create the recipient's transaction
        const recipientTransaction = await prisma.transaction.create({
            data: {
                utorid: recipient.utorid,
                type: 'transfer',
                amount: amount, // Credit points
                relatedId: senderId, // Sender's user ID
                remark,
                createdBy: senderUtorid,
            },
        });

        // Respond with the sender's transaction details
        res.status(201).json({
            id: senderTransaction.id,
            sender: sender.utorid,
            recipient: recipient.utorid,
            type: senderTransaction.type,
            sent: -senderTransaction.amount,
            remark: senderTransaction.remark,
            createdBy: senderTransaction.createdBy,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'failed to create transfer transaction' });
    }
});

app.patch('/transactions/:transactionId/processed', authenticateUser, isCashierOrHigher, async (req, res) => {
    const { transactionId } = req.params;
    const { processed } = req.body;
    const processedBy = req.user.utorid; // Assuming the user's UTORid is stored in the token

    // Validate the payload
    if (processed !== true) {
        return res.status(400).json({ error: 'processed field must be true' });
    }

    try {
        // Find the transaction
        const transaction = await prisma.transaction.findUnique({
            where: { id: parseInt(transactionId) },
        });

        if (!transaction) {
            return res.status(404).json({ error: 'transaction not found' });
        }

        // Check if the transaction is of type "redemption"
        if (transaction.type !== 'redemption') {
            return res.status(400).json({ error: 'transaction is not of type redemption' });
        }

        // Check if the transaction has already been processed
        if (transaction.processed) {
            return res.status(400).json({ error: 'transaction has already been processed' });
        }

        // Get the user
        const user = await prisma.user.findUnique({
            where: { utorid: transaction.utorid },
        });

        if (!user) {
            return res.status(404).json({ error: 'user not found' });
        }

        // Ensure amount is valid
        if (transaction.amount == null) {
            return res.status(400).json({ error: 'Invalid transaction amount' });
        }

        // Deduct the redeemed points from the user's balance
        const newPointsBalance = user.points - transaction.amount;

        if (newPointsBalance < 0) {
            return res.status(400).json({ error: 'Insufficient points' });
        }

        // Update the user's points
        await prisma.user.update({
            where: { utorid: transaction.utorid },
            data: {
                points: newPointsBalance
            },
        });

        // Update the transaction as processed
        const updatedTransaction = await prisma.transaction.update({
            where: { id: parseInt(transactionId) },
            data: {
                processed: true,
                processedBy: processedBy,
            },
        });

        // Return the updated transaction
        res.status(200).json({
            id: updatedTransaction.id,
            utorid: updatedTransaction.utorid,
            type: updatedTransaction.type,
            processedBy: updatedTransaction.processedBy,
            redeemed: updatedTransaction.amount, // Fixed this field
            remark: updatedTransaction.remark,
            createdBy: updatedTransaction.createdBy,
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'internal server error' });
    }
});

// EVENTS
app.post('/events', authenticateUser, isManagerOrHigher, async (req, res) => {

    const {
        name,
        description,
        location,
        startTime,
        endTime,
        capacity,
        points,
    } = req.body;

    // console.log("posting an event.");
    // console.log(req.body);
    // Validate required fields
    if (!name || !description || !location || !startTime || !endTime || !points) {
        return res.status(400).json({ error: 'name, description, location, startTime, endTime, and points are required' });
    }

    // Validate points (must be a positive integer)
    if (!Number.isInteger(points) || points <= 0) {
        return res.status(400).json({ error: 'points must be a positive integer' });
    }

    // Validate capacity (if provided, must be a positive number)
    if ((capacity !== null) && (typeof capacity !== 'number' || capacity <= 0)) {
        return res.status(400).json({ error: 'capacity must be a positive number or null' });
    }

    // Validate startTime and endTime (endTime must be after startTime)
    const start = new Date(startTime);
    const end = new Date(endTime);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({ error: 'startTime and endTime must be valid ISO 8601 dates' });
    }
    if (end <= start) {
        return res.status(400).json({ error: 'endTime must be after startTime' });
    }

    try {
        // Create the event in the database
        const event = await prisma.event.create({
            data: {
                name,
                description,
                location,
                startTime: start,
                endTime: end,
                capacity: capacity || null, // Set to null if capacity is not provided
                pointsRemain: points, // Initialize pointsRemain with the allocated points
                pointsAwarded: 0, // Initialize pointsAwarded to 0
                published: false, // Events are unpublished by default
            },
            include: {
                organizers: true, // Include organizers (empty array by default)
                guests: true, // Include guests (empty array by default)
            },
        });

        // Format the response
        const response = {
            id: event.id,
            name: event.name,
            description: event.description,
            location: event.location,
            startTime: event.startTime.toISOString(),
            endTime: event.endTime.toISOString(),
            capacity: event.capacity,
            pointsRemain: event.pointsRemain,
            pointsAwarded: event.pointsAwarded,
            published: event.published,
            organizers: event.organizers,
            guests: event.guests,
        };

        // Return the response
        res.status(201).json(response);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'failed to create event' });
    }
});

app.get('/events', authenticateUser, async (req, res) => {
    const {
        name,
        location,
        started,
        ended,
        showFull = 'false',
        published,
        page = 1,
        limit = 10,
        sortBy = 'startTime', // Default sort field
        sortOrder = 'asc',    // Default sort order
        startDate,            // For date range filtering
        endDate,               // For date range filtering
        organizerId
    } = req.query; // Use req.query for GET requests

    const role = req.user.role.toUpperCase(); // Get the user's role from authentication
    
    // Validate query parameters
    if (started != null && ended != null) {
        return res.status(400).json({ error: 'cannot specify both started and ended' });
    }

    if (page < 1 || limit < 1) {
        return res.status(400).json({ error: "stfu dont do this" });
    }

    try {
        const now = new Date();

        // Build the filter object
        const filter = {};

        // Regular users can only see published events
        if (role === 'REGULAR' || role === 'CASHIER') {
            filter.published = true;
        }

        // Filter by name
        if (name) {
            filter.name = { contains: name };
        }

        // Filter by location
        if (location) {
            filter.location = { contains: location };
        }

        // Filter by started
        if (started !== null && started != undefined) {
            if (started === 'true') {
                filter.startTime = { lte: now }; // Events that have started
            } else {
                filter.startTime = { gt: now }; // Events that have not started
            }
        }

        // Filter by ended
        if (ended !== null && ended != undefined) {
            if (ended === 'true') {
                filter.endTime = { lte: now }; // Events that have ended
            } else {
                filter.endTime = { gt: now }; // Events that have not ended
            }
        }

        // Date range filtering
        if (startDate && endDate) {
            filter.startTime = {
                ...filter.startTime,
                gte: new Date(startDate)
            };
            filter.endTime = {
                ...filter.endTime,
                lte: new Date(endDate)
            };
        }
        
        if (organizerId) {
            filter.organizers = {
                some: {
                    utorid: organizerId
                }
            };
        }

        // Filter by published status (only for MANAGER or higher)
        if (role !== 'REGULAR' && published !== null && published != undefined) {
            filter.published = published === 'true';
        }

        // Count total events matching the filters
        let count = await prisma.event.count({ where: filter });

        // Prepare the orderBy object for sorting
        const validSortFields = ['name', 'location', 'startTime', 'endTime', 'capacity'];
        const orderBy = {};
        
        // Check if sortBy is valid and use it, otherwise default to startTime
        if (validSortFields.includes(sortBy)) {
            orderBy[sortBy] = sortOrder.toLowerCase() === 'desc' ? 'desc' : 'asc';
        } else {
            orderBy.startTime = 'asc';
        }
        let events;
        // Fetch paginated events with sorting
        if (showFull === 'false') {
            // First get the IDs of non-full events that match all other filters
            const nonFullEventIds = await prisma.$queryRaw`
                SELECT e.id 
                FROM "Event" e
                LEFT JOIN "event_guests" eg ON eg."eventId" = e.id
                WHERE e.capacity > (
                    SELECT COUNT(*) 
                    FROM "event_guests" eg2 
                    WHERE eg2."eventId" = e.id
                )
                GROUP BY e.id
                LIMIT ${parseInt(limit)}
                OFFSET ${(parseInt(page) - 1) * parseInt(limit)}
            `;

            // Then get full event details for these IDs
            events = await prisma.event.findMany({
                where: {
                    ...filter,
                    id: { in: nonFullEventIds.map(e => e.id) }
                },
                include: {
                    guests: true,
                    organizers: {
                        select: {
                            id: true,
                            utorid: true,
                            name: true
                        }
                    }
                },
                orderBy
            });

            // Get accurate count of non-full events
            count = await prisma.$queryRaw`
                SELECT COUNT(*) as count
                FROM "Event" e
                WHERE e.capacity > (
                    SELECT COUNT(*) 
                    FROM "event_guests" eg 
                    WHERE eg."eventId" = e.id
                )
            `;
            count = Number(count[0].count);
        } else {
            // Original query when showFull is true
            count = await prisma.event.count({ where: filter });
            events = await prisma.event.findMany({
                where: filter,
                orderBy,
                skip: (parseInt(page) - 1) * parseInt(limit),
                take: parseInt(limit),
                include: {
                    guests: true,
                    organizers: {
                        select: {
                            id: true,
                            utorid: true,
                            name: true
                        }
                    }
                },
            });
        }

        // Format the response based on the user's role
        const results = events.map(event => {
            const baseResponse = {
                id: event.id,
                name: event.name,
                location: event.location,
                startTime: event.startTime.toISOString(),
                endTime: event.endTime.toISOString(),
                capacity: event.capacity,
                numGuests: event.guests.length,
                organizers: event.organizers,
            };

            // Add additional fields for MANAGER or higher
            if (role !== 'REGULAR') {
                baseResponse.pointsRemain = event.pointsRemain;
                baseResponse.pointsAwarded = event.pointsAwarded;
                baseResponse.published = event.published;
            }

            return baseResponse;
        });
        // Return the response
        res.status(200).json({
            count,
            results,
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'internal server error' });
    }
});
app.get('/events/:eventId', authenticateUser, async (req, res) => {
    const { eventId } = req.params;
    const { role, utorid } = req.user;
    const parsedEventId = parseInt(eventId);
    // console.log("GETTING CALLED")
    if (isNaN(parsedEventId)) {
        return res.status(400).json({ error: 'Invalid event ID' });
    }

    try {
        // Fetch the event with organizers and guests (now selecting specific guest fields)
        const event = await prisma.event.findUnique({
            where: { id: parsedEventId },
            include: {
                organizers: {
                    select: {
                        id: true,
                        utorid: true,
                        name: true,
                    },
                },
                guests: {
                    select: {
                        id: true,
                        utorid: true,
                        name: true,  // Explicitly include name
                        // Add any other guest fields you need
                    }
                },
            },
        });

        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        // Check permissions
        const isManagerOrHigher = ['MANAGER', 'SUPERUSER'].includes(role.toUpperCase());
        const isOrganizer = event.organizers.some(org => org.utorid === utorid);

        if (['REGULAR', 'CASHIER'].includes(role) && !event.published) {
            return res.status(404).json({ error: 'Event not found' });
        }

        // Format response with proper guest names
        const response = {
            id: event.id,
            name: event.name,
            description: event.description,
            location: event.location,
            startTime: event.startTime.toISOString(),
            endTime: event.endTime.toISOString(),
            capacity: event.capacity,
            pointsRemain: isManagerOrHigher || isOrganizer ? event.pointsRemain : undefined,
            pointsAwarded: isManagerOrHigher || isOrganizer ? event.pointsAwarded : undefined,
            published: isManagerOrHigher || isOrganizer ? event.published : undefined,
            organizers: event.organizers,
            guests: isManagerOrHigher || isOrganizer ?
                event.guests.map(g => ({
                    ...g,
                    name: g.name || 'Guest' // Fallback for missing names
                })) :
                undefined,
            numGuests: event.guests.length
        };
        // console.log("Calling get events :P")
        // console.log(response)
        res.status(200).json(response);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.patch('/events/:eventId', authenticateUser, async (req, res) => {
    const { eventId } = req.params;
    const userRole = req.user.role;
    const userUtorid = req.user.utorid;
    let { name, description, location, startTime, endTime, capacity, points, published } = req.body;
    // In your PATCH /events/:id endpoint

    try {
        const eventIdInt = parseInt(eventId, 10);
        if (isNaN(eventIdInt)) return res.status(400).json({ error: 'Invalid event ID format' });

        const existingEvent = await prisma.event.findUnique({
            where: { id: eventIdInt },
            include: { organizers: { select: { id: true, utorid: true, name: true } }, guests: true },
        });

        if (!existingEvent) return res.status(404).json({ error: 'event not found' });

        const isManagerOrHigher = ['MANAGER', 'SUPERUSER'].includes(userRole.toUpperCase());
        const isOrganizer = existingEvent.organizers.some(org => org.utorid === userUtorid);



        if (!isManagerOrHigher && !isOrganizer) return res.status(403).json({ error: 'access denied' });

        if (!isManagerOrHigher) {
            // Remove restricted fields if not manager/superuser
            published = null;
            points = null;
        }

        const now = new Date();

        if (startTime != null && new Date(startTime) < now)
            return res.status(400).json({ error: 'startTime cannot be in the past' });
        if (endTime != null && new Date(endTime) < now)
            return res.status(400).json({ error: 'endTime cannot be in the past' });
        if (startTime != null && endTime != null && new Date(startTime) >= new Date(endTime))
            return res.status(400).json({ error: 'endTime must be after startTime' });

        if (capacity != null && (capacity <= 0 || !Number.isInteger(capacity)))
            return res.status(400).json({ error: 'capacity must be a positive integer or null' });
        if (capacity != null && capacity < existingEvent.guests.length)
            return res.status(400).json({ error: 'capacity cannot be reduced below the number of confirmed guests' });

        if (points != null) {
            if (!isManagerOrHigher) return res.status(403).json({ error: 'only managers can update points' });
            if (!Number.isInteger(points) || points <= 0)
                return res.status(400).json({ error: 'points must be a positive integer' });
            if (points < existingEvent.pointsAwarded)
                return res.status(400).json({ error: 'points reduction would result in negative remaining points' });
        }

        if (published != null) {
            if (!isManagerOrHigher) return res.status(403).json({ error: 'only managers can update published status' });
            if (published !== true) return res.status(400).json({ error: 'published can only be set to true' });
        }

        if (existingEvent.startTime < now &&
            (name != null || description != null || location != null || startTime != null || capacity != null)) {
            return res.status(400).json({ error: 'updates to name, description, location, startTime, or capacity are not allowed after the event has started' });
        }

        if (existingEvent.endTime < now && endTime != null)
            return res.status(400).json({ error: 'updates to endTime are not allowed after the event has ended' });

        const updateData = {};
        if (name != null) updateData.name = name;
        if (description != null) updateData.description = description;
        if (location != null) updateData.location = location;
        if (startTime != null) updateData.startTime = new Date(startTime);
        if (endTime != null) updateData.endTime = new Date(endTime);
        if (capacity != null) updateData.capacity = capacity;
        if (points != null) updateData.pointsRemain = points;
        if (published != null) updateData.published = published;
        const updatedEvent = await prisma.event.update({
            where: { id: eventIdInt },
            data: updateData,
        });

        const response = {
            id: updatedEvent.id,
            name: updatedEvent.name,
            location: updatedEvent.location,
            startTime: updatedEvent.startTime?.toISOString(),
            endTime: updatedEvent.endTime?.toISOString(),
            capacity: updatedEvent.capacity,
            pointsRemain: updatedEvent.pointsRemain,
            published: updatedEvent.published,
        };

        res.status(200).json(response);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'internal server error' });
    }
});

app.delete('/events/:eventId/guests/me', authenticateUser, isRegularOrHigher, async (req, res) => {
    const { eventId } = req.params;
    const userUtorid = req.user.utorid; // Assuming the user's UTORid is stored in the token
    const eventIdInt = parseInt(eventId, 10);

    if (isNaN(eventIdInt)) {
        return res.status(400).json({ error: 'Invalid event ID format' });
    }
    try {
        // Fetch the existing event
        const existingEvent = await prisma.event.findUnique({
            where: { id: parseInt(eventIdInt) },
        });

        // Check if the event exists
        if (!existingEvent) {
            return res.status(404).json({ error: 'event not found' });
        }

        // Check if the event has ended
        if (existingEvent.endTime < new Date()) {
            return res.status(410).json({ error: 'event has ended' });
        }

        // Fetch the guest record for the logged-in user
        const guest = await prisma.eventGuest.findFirst({
            where: {
                eventId: parseInt(eventId),
                utorid: userUtorid,

            },
        });

        // Check if the user has RSVPed to the event
        if (!guest) {
            return res.status(404).json({ error: 'user did not RSVP to this event' });
        }

        // Remove the user as a guest
        await prisma.eventGuest.delete({
            where: { id: guest.id },
        });

        // Return 204 No Content on success
        res.status(204).send();

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'internal server error' });
    }
});
app.delete('/events/:eventId/guests/:userId', authenticateUser, isManagerOrHigher, async (req, res) => {
    const { eventId, userId } = req.params;
    const eventIdInt = parseInt(eventId, 10);

    if (isNaN(eventIdInt)) {
        return res.status(400).json({ error: 'Invalid event ID format' });
    }
    try {
        // Fetch the existing event
        const existingEvent = await prisma.event.findUnique({
            where: { id: parseInt(eventIdInt) },
        });

        // Check if the event exists
        if (!existingEvent) {
            return res.status(404).json({ error: 'event not found' });
        }

        // Fetch the guest to ensure they exist and are associated with the event
        const guest = await prisma.eventGuest.findFirst({
            where: {
                eventId: parseInt(eventId),
                id: parseInt(userId),
            },
        });

        // Check if the guest exists
        if (!guest) {
            return res.status(404).json({ error: 'guest not found' });
        }

        // Remove the guest
        await prisma.eventGuest.delete({
            where: { id: parseInt(userId) },
        });

        // Return 204 No Content on success
        res.status(204).send();

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'internal server error' });
    }
});

app.delete('/events/:eventId/organizers/:userId', authenticateUser, isManagerOrHigher, async (req, res) => {
    const { eventId, userId } = req.params;
    const eventIdInt = parseInt(eventId, 10);

    if (isNaN(eventIdInt)) {
        return res.status(400).json({ error: 'Invalid event ID format' });
    }
    try {
        // Fetch the existing event
        const existingEvent = await prisma.event.findUnique({
            where: { id: parseInt(eventIdInt) },
        });

        // Check if the event exists
        if (!existingEvent) {
            return res.status(404).json({ error: 'event not found' });
        }

        // Fetch the organizer to ensure they exist and are associated with the event
        const organizer = await prisma.eventOrganizer.findFirst({
            where: {
                eventId: parseInt(eventId),
                id: parseInt(userId),
            },
        });
        const eventOrganizers = await prisma.eventOrganizer.findMany({
            where: { eventId: eventIdInt },
            select: { id: true, utorid: true }, // Adjust selection as needed
        });
        // Check if the organizer exists
        if (!organizer) {
            console.log('Organizer not found');
            console.log(userId);
            console.log(existingEvent);
            console.log(eventOrganizers);
            return res.status(404).json({ error: 'organizer not found' });
        }

        // Remove the organizer
        await prisma.eventOrganizer.delete({
            where: { id: parseInt(userId) },
        });

        // Return 204 No Content on success
        res.status(204).send();

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'internal server error' });
    }
});

app.delete('/events/:eventId', authenticateUser, isManagerOrHigher, async (req, res) => {
    const { eventId } = req.params;
    const eventIdInt = parseInt(eventId, 10);

    if (isNaN(eventIdInt)) {
        return res.status(400).json({ error: 'Invalid event ID format' });
    }
    try {
        // Fetch the existing event
        const existingEvent = await prisma.event.findUnique({
            where: { id: parseInt(eventIdInt) },
        });

        // Check if the event exists
        if (!existingEvent) {
            return res.status(404).json({ error: 'event not found' });
        }

        // Check if the event has already been published
        if (existingEvent.published) {
            return res.status(400).json({ error: 'cannot delete a published event' });
        }

        // Delete the event
        await prisma.event.delete({
            where: { id: parseInt(eventId) },
        });

        // Return 204 No Content on success
        res.status(204).send();

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'internal server error' });
    }
});

app.post('/events/:eventId/organizers', authenticateUser, isManagerOrHigher, async (req, res) => {
    const { eventId } = req.params;
    const { utorid } = req.body;
    const eventIdInt = parseInt(eventId, 10);

    if (isNaN(eventIdInt)) {
        return res.status(400).json({ error: 'Invalid event ID format' });
    }
    try {
        // Fetch the existing event with organizers and guests
        const existingEvent = await prisma.event.findUnique({
            where: { id: parseInt(eventIdInt) },
            include: {
                organizers: {
                    select: {
                        id: true,
                        utorid: true,
                        name: true,
                    },
                },
                guests: true, // Include guests to check if the user is a guest
            },
        });

        // Check if the event exists
        if (!existingEvent) {
            return res.status(404).json({ error: 'event not found' });
        }

        // Check if the event has ended
        if (existingEvent.endTime < new Date()) {
            return res.status(410).json({ error: 'event has ended' });
        }

        // Check if the user is already a guest of the event
        const isGuest = existingEvent.guests.some(guest => guest.utorid === utorid);
        if (isGuest) {
            return res.status(400).json({ error: 'user is registered as a guest to the event' });
        }

        // Fetch the user to ensure they exist
        const user = await prisma.user.findUnique({
            where: { utorid },
            select: {
                id: true,
                utorid: true,
                name: true,
            },
        });

        if (!user) {
            return res.status(404).json({ error: 'user not found' });
        }

        // Add the user as an organizer
        await prisma.eventOrganizer.create({
            data: {
                eventId: parseInt(eventId),
                utorid: user.utorid,
                name: user.name,
            },
        });

        // Fetch the updated event with organizers
        const updatedEvent = await prisma.event.findUnique({
            where: { id: parseInt(eventId) },
            include: {
                organizers: {
                    select: {
                        id: true,
                        utorid: true,
                        name: true,
                    },
                },
            },
        });

        // Format the response
        const response = {
            id: updatedEvent.id,
            name: updatedEvent.name,
            location: updatedEvent.location,
            organizers: updatedEvent.organizers,
        };

        // Return the response
        res.status(201).json(response);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'internal server error' });
    }
});

app.post('/events/:eventId/guests/me', authenticateUser, isRegularOrHigher, async (req, res) => {
    const { eventId } = req.params;
    const userUtorid = req.user.utorid; // Assuming the user's UTORid is stored in the token
    const userName = req.user.name; // Assuming the user's name is stored in the token
    const parsedEventId = parseInt(eventId);

    if (isNaN(parsedEventId)) {
        return res.status(400).json({ error: 'Invalid event ID' });
    }
    try {
        // Fetch the existing event with guests
        const existingEvent = await prisma.event.findUnique({
            where: { id: parseInt(parsedEventId) },
            include: {
                guests: true, // Include guests to calculate numGuests
            },
        });

        // Check if the event exists
        if (!existingEvent) {
            return res.status(404).json({ error: 'event not found' });
        }

        // Check if the event has ended
        if (existingEvent.endTime < new Date()) {
            return res.status(410).json({ error: 'event has ended' });
        }

        // Check if the event is full
        if (existingEvent.capacity !== null && existingEvent.guests.length >= existingEvent.capacity) {
            return res.status(410).json({ error: 'event is full' });
        }

        // Check if the user is already on the guest list
        const isAlreadyGuest = existingEvent.guests.some(guest => guest.utorid === userUtorid);
        if (isAlreadyGuest) {
            return res.status(400).json({ error: 'user is already on the guest list' });
        }

        // Add the user as a guest
        const addedGuest = await prisma.eventGuest.create({
            data: {
                eventId: parseInt(eventId),
                utorid: userUtorid,
                name: userName,
            },
        });

        // Fetch the updated event with guests
        const updatedEvent = await prisma.event.findUnique({
            where: { id: parseInt(eventId) },
            include: {
                guests: true, // Include guests to calculate numGuests
            },
        });

        // Format the response
        const response = {
            id: updatedEvent.id,
            name: updatedEvent.name,
            location: updatedEvent.location,
            guestAdded: {
                id: addedGuest.id,
                utorid: userUtorid,
                name: userName,
            },
            numGuests: updatedEvent.guests.length,
        };

        // Return the response
        res.status(201).json(response);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'internal server error' });
    }
});

app.post('/events/:eventId/guests', authenticateUser, async (req, res) => {
    const { eventId } = req.params;
    const { utorid } = req.body;
    const userRole = req.user.role; // Assuming the user's role is stored in the token
    const userUtorid = req.user.utorid; // Assuming the user's UTORid is stored in the token
    console.log(eventId)
    if (isNaN(parseInt(eventId))) {
        return res.status(400).json({ error: 'Invalid event ID' });
    }

    try {
        // Fetch the existing event with organizers and guests
        const existingEvent = await prisma.event.findUnique({
            where: { id: parseInt(eventId) },
            include: {
                organizers: {
                    select: {
                        id: true,
                        utorid: true,
                        name: true,
                    },
                },
                guests: true, // Include guests to calculate numGuests
            },
        });

        // Check if the event exists
        if (!existingEvent) {
            console.log("EVENT NOT EXIST.")
            return res.status(404).json({ error: 'event not found' });
        }

        // Check if the user is a manager or higher
        const isManagerOrHigher = ['MANAGER', 'SUPERUSER'].includes(userRole.toUpperCase());

        // Check if the user is an organizer of the event
        const isOrganizer = existingEvent.organizers.some(organizer => organizer.utorid === userUtorid);

        // Allow access if the user is a manager, higher, or an organizer
        if (!isManagerOrHigher && !isOrganizer) {
            return res.status(403).json({ error: 'access denied' });
        }
        // Check if the event is visible to the organizer
        if (!existingEvent.published && !isManagerOrHigher) {
            console.log("NOT VISIBLE TO ORGANIZER YET?")
            return res.status(404).json({ error: 'event is not visible to the organizer yet' });
        }

        // Check if the event has ended
        if (existingEvent.endTime < new Date()) {
            return res.status(410).json({ error: 'event has ended' });
        }

        // Check if the event is full
        if (existingEvent.capacity !== null && existingEvent.guests.length >= existingEvent.capacity) {
            return res.status(410).json({ error: 'event is full' });
        }
        // Check if the user is already an organizer of the event
        const isAlreadyOrganizer = existingEvent.organizers.some(organizer => organizer.utorid === utorid);
        if (isAlreadyOrganizer) {
            return res.status(400).json({ error: 'user is registered as an organizer to the event' });
        }

        // Fetch the user to ensure they exist
        const user = await prisma.user.findUnique({
            where: { utorid },
            select: {
                id: true,
                utorid: true,
                name: true,
            },
        });

        if (!user) {
            console.log("user not found");
            return res.status(404).json({ error: 'user not found' });
        }
        // Add the user as a guest
        await prisma.eventGuest.create({
            data: {
                eventId: parseInt(eventId),
                utorid: user.utorid,
                name: user.name
            },
        });

        // Fetch the updated event with guests
        const updatedEvent = await prisma.event.findUnique({
            where: { id: parseInt(eventId) },
            include: {
                guests: {
                    select: {
                        id: true,
                        utorid: true,
                        name: true,
                    },
                },
            },
        });

        // Format the response
        const response = {
            id: updatedEvent.id,
            name: updatedEvent.name,
            location: updatedEvent.location,
            guestAdded: {
                id: user.id,
                utorid: user.utorid,
                name: user.name,
            },
            numGuests: updatedEvent.guests.length,
        };
        console.log(response)
        // Return the response
        res.status(201).json(response);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'internal server error' });
    }
});

app.post('/events/:eventId/transactions', authenticateUser, async (req, res) => {
    const { eventId } = req.params;
    const { type, utorid, amount, remark } = req.body;
    const createdBy = req.user.utorid; // Assuming the user's UTORid is stored in the token
    const userRole = req.user.role; // Assuming the user's role is stored in the token

    const parsedEventId = parseInt(eventId);
    if (isNaN(parsedEventId)) {
        return res.status(400).json({ error: 'Invalid event ID' });
    }

    try {
        // Validate the payload
        if (type !== 'event') {
            return res.status(400).json({ error: 'type must be "event"' });
        }
        if (!Number.isInteger(amount) || amount <= 0) {
            return res.status(400).json({ error: 'amount must be a positive integer' });
        }

        // Fetch the existing event with guests and pointsRemain
        const existingEvent = await prisma.event.findUnique({
            where: { id: parsedEventId },
            include: {
                guests: true, // Include guests to check if the user is on the guest list
                organizers: true, // Include organizers to check if the user is an organizer
            },
        });

        // Check if the event exists
        if (!existingEvent) {
            return res.status(404).json({ error: 'event not found' });
        }

        // Check if the user is a manager or higher
        const isManagerOrHigher = ['MANAGER', 'SUPERUSER'].includes(userRole.toUpperCase());

        // Check if the user is an organizer of the event
        const isOrganizer = existingEvent.organizers && existingEvent.organizers.some(organizer => organizer.utorid === createdBy);

        // Allow access if the user is a manager, higher, or an organizer
        if (!isManagerOrHigher && !isOrganizer) {
            return res.status(403).json({ error: 'access denied' });
        }

        // Check if the event has enough remaining points
        if (existingEvent.pointsRemain < amount) {
            return res.status(400).json({ error: 'insufficient remaining points' });
        }

        // If utorid is specified, check if the user is on the guest list
        if (utorid) {
            const isGuest = existingEvent.guests && existingEvent.guests.some(guest => guest.utorid === utorid);
            if (!isGuest) {
                return res.status(400).json({ error: 'user is not on the guest list' });
            }
        }

        // Prepare the transaction data
        const transactionData = {
            type: 'event',
            earned: amount,
            remark: remark || '',
            createdBy,
            eventId: parsedEventId,
            relatedId: parsedEventId
        };

        let transactions;

        if (utorid) {
            // Create a single transaction for the specified guest
            const transaction = await prisma.transaction.create({
                data: {
                    ...transactionData,
                    utorid,
                },
            });

            // Deduct the points from the event's pointsRemain
            await prisma.event.update({
                where: { id: parsedEventId },
                data: {
                    pointsRemain: existingEvent.pointsRemain - amount,
                    pointsAwarded: existingEvent.pointsAwarded + amount,
                },
            });

            // Add the awarded points to the recipient's account
            await prisma.user.update({
                where: { utorid },
                data: {
                    points: { increment: amount }  // Adds `amount` to user's existing points
                }
            });

            const user = await prisma.user.findUnique({
                where: { utorid }
            });

            // Format the response
            transactions = {
                id: transaction.id,
                recipient: utorid,
                awarded: amount,
                type: 'event',
                spent: 0,
                relatedId: parsedEventId,
                remark: transaction.remark,
                createdBy: transaction.createdBy,
            };
        } else {
            // Create transactions for all guests
            const guestUtorids = existingEvent.guests ? existingEvent.guests.map(guest => guest.utorid) : [];
            const createdTransactions = await Promise.all(
                guestUtorids.map(async (guestUtorid) => {
                    return await prisma.transaction.create({
                        data: {
                            ...transactionData,
                            utorid: guestUtorid,
                        },
                    });
                })
            );

            // Deduct the points from the event's pointsRemain
            const totalPointsAwarded = amount * guestUtorids.length;
            await prisma.event.update({
                where: { id: parsedEventId },
                data: {
                    pointsRemain: existingEvent.pointsRemain - totalPointsAwarded,
                    pointsAwarded: existingEvent.pointsAwarded + totalPointsAwarded,
                },
            });

            await Promise.all(
                guestUtorids.map(async (guestUtorid) => {
                    await prisma.user.update({
                        where: { utorid: guestUtorid },
                        data: {
                            points: { increment: amount }
                        }
                    });
                })
            );

            // Format the response
            transactions = createdTransactions.map(transaction => ({
                id: transaction.id,
                recipient: transaction.utorid,
                awarded: amount,
                type: 'event',
                relatedId: parsedEventId,
                spent: 0,
                remark: transaction.remark,
                createdBy: transaction.createdBy,
            }));
        }

        // Return the response
        res.status(201).json(transactions);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'internal server error' });
    }
});


app.post('/promotions', authenticateUser, isManagerOrHigher, async (req, res) => {
    const {
        name,
        description,
        type,
        startTime,
        endTime,
        minSpending,
        rate,
        points,
    } = req.body;
    // console.log(req.body)
    try {
        // Validate required fields
        if (name == null || description == null || type == null || startTime == null || endTime == null) {
            console.log("Missing required fields");
            return res.status(400).json({ error: 'missing required fields' });
        }

        // Validate type
        if (type !== 'automatic' && type !== 'one-time') {
            console.log(['type is not right'])
            return res.status(400).json({ error: 'type must be either "automatic" or "one-time"' });
        }

        // Validate startTime and endTime
        const start = new Date(startTime);
        const end = new Date(endTime);
        const now = new Date();
        if (isNaN(start.getTime())) {
            console.log("invalid time")
            return res.status(400).json({ error: 'invalid startTime format' });
        }
        if (isNaN(end.getTime())) {
            console.log("invalid time End")
            return res.status(400).json({ error: 'invalid endTime format' });
        }
        if (start < now) {
            console.log("past time")
            return res.status(400).json({ error: 'startTime cannot be in the past' });
        }
        if (end <= start) {
            console.log("swapped ends")
            return res.status(400).json({ error: 'endTime must be after startTime' });
        }

        // Validate minSpending
        if (minSpending !== null && (typeof minSpending !== 'number' || minSpending <= 0)) {
            console.log("minspending is negative")
            return res.status(400).json({ error: 'minSpending must be a positive numeric value' });
        }

        // Validate rate
        if (rate !== null && (typeof rate !== 'number' || rate <= 0)) {
            console.log("rate is negative")
            return res.status(400).json({ error: 'rate must be a positive numeric value' });
        }

        // Validate points
        if (points !== null && (!Number.isInteger(points) || points < 0)) {
            console.log("points negative")
            return res.status(400).json({ error: 'points must be a positive integer value' });
        }

        // Create the promotion
        const newPromotion = await prisma.promotion.create({
            data: {
                name,
                description,
                type,
                startTime: start,
                endTime: end,
                minSpending,
                rate,
                points,
            },
        });

        // Format the response
        const response = {
            id: newPromotion.id,
            name: newPromotion.name,
            description: newPromotion.description,
            type: newPromotion.type,
            startTime: newPromotion.startTime.toISOString(),
            endTime: newPromotion.endTime.toISOString(),
            minSpending: newPromotion.minSpending,
            rate: newPromotion.rate,
            points: newPromotion.points,
        };

        // Return the response
        res.status(201).json(response);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'internal server error' });
    }
});

app.get('/promotions', authenticateUser, async (req, res) => {
    const {
        name,
        type,
        page = 1,
        limit = 10,
    } = req.query;
    const userRole = req.user.role; // Assuming the user's role is stored in the token
    const userUtorid = req.user.utorid; // Assuming the user's UTORid is stored in the token
    if (page < 1 || limit < 1) {
        return res.status(400).json({ err: "WHATRE YOU DOING?" })
    }
    try {
        const now = new Date();

        // Build the filter object
        const filter = {};

        // Regular users can only see active promotions they have not used
        if (['REGULAR', 'CASHIER'].includes(userRole)) {
            filter.startTime = { lte: now }; // Promotions that have started
            filter.endTime = { gt: now }; // Promotions that have not ended

            // Exclude promotions the user has already used
            const usedPromotions = await prisma.usage.findMany({
                where: {
                    userId: req.user.userId, // Assuming the user's ID is stored in the token
                },
                select: {
                    promotionId: true,
                },
            });

            const usedPromotionIds = usedPromotions.map(usage => usage.promotionId);
            if (usedPromotionIds.length > 0) {
                filter.id = { notIn: usedPromotionIds };
            }
        }

        // Filter by name
        if (name) {
            filter.name = { contains: name, mode: 'insensitive' };
        }

        // Filter by type
        if (type) {
            if (type !== 'automatic' && type !== 'one-time') {
                return res.status(400).json({ error: 'type must be either "automatic" or "one-time"' });
            }
            filter.type = type;
        }

        // Count total promotions matching the filters
        const count = await prisma.promotion.count({ where: filter });

        // Fetch paginated promotions
        const promotions = await prisma.promotion.findMany({
            where: filter,
            skip: (page - 1) * limit,
            take: parseInt(limit),
            select: {
                id: true,
                name: true,
                type: true,
                endTime: true,
                startTime: true,
                minSpending: true,
                rate: true,
                points: true,
            },
        });

        // Format the response
        const results = promotions.map(promotion => ({
            id: promotion.id,
            name: promotion.name,
            type: promotion.type,
            endTime: promotion.endTime.toISOString(),
            startTime: promotion.startTime.toISOString(),
            minSpending: promotion.minSpending,
            rate: promotion.rate,
            points: promotion.points,
        }));

        // Return the response
        res.status(200).json({
            count,
            results,
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'internal server error' });
    }
});

// GET /promotions - Get a list of promotions (Manager or higher)
app.get('/promotions', authenticateUser, isManagerOrHigher, async (req, res) => {
    try {
        const { started, ended } = req.query;

        // Validate that both started and ended are not specified together
        if (started !== null && ended !== null) {
            return res.status(400).json({
                error: 'specifying both started and ended parameters is not allowed'
            });
        }

        // Build filter conditions based on query parameters
        const filterConditions = {};

        const now = new Date();

        if (started !== null) {
            const isStarted = started === 'true';
            if (isStarted) {
                // Promotions that have started (startTime <= now)
                filterConditions.startTime = {
                    lte: now
                };
            } else {
                // Promotions that have not started (startTime > now)
                filterConditions.startTime = {
                    gt: now
                };
            }
        }

        if (ended !== null) {
            const isEnded = ended === 'true';
            if (isEnded) {
                // Promotions that have ended (endTime <= now)
                filterConditions.endTime = {
                    lte: now
                };
            } else {
                // Promotions that have not ended (endTime > now)
                filterConditions.endTime = {
                    gt: now
                };
            }
        }

        // Query promotions with the filter conditions
        const promotions = await prisma.promotion.findMany({
            where: filterConditions,
            select: {
                id: true,
                name: true,
                type: true,
                startTime: true,
                endTime: true,
                minSpending: true,
                rate: true,
                points: true
            }
        });

        // Format the response
        const response = {
            count: promotions.length,
            results: promotions
        };

        return res.status(200).json(response);

    } catch (error) {
        console.error('Error retrieving promotions:', error);
        return res.status(500).json({ error: 'failed to retrieve promotions' });
    }
});

// GET /promotions/:promotionId - Get a single promotion (Regular or higher)
app.get('/promotions/:promotionId', authenticateUser, async (req, res) => {
    try {
        const { promotionId } = req.params;

        // Convert promotionId to number
        const id = parseInt(promotionId);
        if (isNaN(id)) {
            return res.status(400).json({ error: 'invalid promotion id' });
        }

        // Find the promotion
        const promotion = await prisma.promotion.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                description: true,
                type: true,
                startTime: true,
                endTime: true,
                minSpending: true,
                rate: true,
                points: true
            }
        });

        // Check if promotion exists
        if (!promotion) {
            return res.status(404).json({ error: 'promotion not found' });
        }

        const now = new Date();
        const userRole = req.user.role.toUpperCase();
        const isManagerOrHigher = ['MANAGER', 'SUPERUSER'].includes(userRole);

        // Manager or higher gets full details regardless of active status
        if (isManagerOrHigher) {
            return res.status(200).json({
                id: promotion.id,
                name: promotion.name,
                description: promotion.description,
                type: promotion.type,
                startTime: promotion.startTime,
                endTime: promotion.endTime,
                minSpending: promotion.minSpending,
                rate: promotion.rate,
                points: promotion.points
            });
        }

        // Regular users can only see active promotions (without startTime)
        if (promotion.startTime > now || promotion.endTime < now) {
            return res.status(404).json({ error: 'promotion is inactive' });
        }

        return res.status(200).json({
            id: promotion.id,
            name: promotion.name,
            description: promotion.description,
            type: promotion.type,
            endTime: promotion.endTime,
            minSpending: promotion.minSpending,
            rate: promotion.rate,
            points: promotion.points
        });

    } catch (error) {
        console.error('Error retrieving promotion:', error);
        return res.status(500).json({ error: 'failed to retrieve promotion' });
    }
});

// PATCH /promotions/:promotionId - Update an existing promotion (Manager or higher)
app.patch('/promotions/:promotionId', authenticateUser, isManagerOrHigher, async (req, res) => {
    try {
        const { promotionId } = req.params;
        const id = parseInt(promotionId);

        if (isNaN(id)) {
            console.log('invalid id' + promotionId);
            return res.status(400).json({ error: 'invalid promotion id' });
        }

        // Find the existing promotion
        const existingPromotion = await prisma.promotion.findUnique({
            where: { id }
        });

        if (!existingPromotion) {
            return res.status(404).json({ error: 'promotion not found' });
        }

        // Extract fields from request body
        const { name, description, type, startTime, endTime, minSpending, rate, points } = req.body;

        // Validate required fields
        if (!name && !description && !type && !startTime && !endTime) {
            return res.status(400).json({ error: 'name, description, type, startTime, and endTime are required' });
        }

        // Validate promotion type
        if (type !== 'automatic' && type !== 'one-time' && type != null) {
            return res.status(400).json({ error: 'type must be either "automatic" or "one-time"' });
        }

        // Parse dates
        const parsedStartTime = new Date(startTime);
        const parsedEndTime = new Date(endTime);
        const now = new Date();

        // Validate date formats
        if (isNaN(parsedStartTime.getTime()) || isNaN(parsedEndTime.getTime())) {
            return res.status(400).json({ error: 'invalid date format. Use ISO 8601 format' });
        }

        // Validate that start time is before end time
        if (parsedStartTime >= parsedEndTime) {
            return res.status(400).json({ error: 'endTime must be after startTime' });
        }

        // Validate that start time and end time are not in the past
        if (parsedStartTime < now || parsedEndTime < now) {
            return res.status(400).json({ error: 'startTime and endTime cannot be in the past' });
        }

        // Check if the original start time has passed
        if (new Date(existingPromotion.startTime) < now) {
            // If start time has passed, we can only update endTime
            if (name !== existingPromotion.name ||
                description !== existingPromotion.description ||
                type !== existingPromotion.type ||
                parsedStartTime.getTime() !== new Date(existingPromotion.startTime).getTime() ||
                minSpending !== existingPromotion.minSpending ||
                rate !== existingPromotion.rate ||
                points !== existingPromotion.points) {
                return res.status(400).json({
                    error: 'cannot update name, description, type, startTime, minSpending, rate, or points after promotion has started'
                });
            }
        }

        // Check if the original end time has passed
        if (new Date(existingPromotion.endTime) < now) {
            return res.status(400).json({ error: 'cannot update promotion after it has ended' });
        }

        // Validate numeric fields
        if (minSpending !== null && (isNaN(minSpending) || minSpending <= 0)) {
            return res.status(400).json({ error: 'minSpending must be a positive number' });
        }

        if (rate !== null && (isNaN(rate) || rate <= 0)) {
            return res.status(400).json({ error: 'rate must be a positive number' });
        }

        if (points !== null && (isNaN(points) || points <= 0 || !Number.isInteger(points))) {
            return res.status(400).json({ error: 'points must be a positive integer' });
        }

        // Prepare update data
        const updateData = {
            name,
            description,
            type,
            startTime: parsedStartTime,
            endTime: parsedEndTime
        };

        // Add optional fields if they're defined
        if (minSpending !== null) updateData.minSpending = minSpending;
        if (rate !== null) updateData.rate = rate;
        if (points !== null) updateData.points = points;

        // Update the promotion
        const updatedPromotion = await prisma.promotion.update({
            where: { id },
            data: updateData
        });

        // Create response with only updated fields
        const response = {
            id: updatedPromotion.id,
            name: updatedPromotion.name,
            type: updatedPromotion.type
        };

        // Add other fields if they were updated
        if (endTime !== existingPromotion.endTime) response.endTime = updatedPromotion.endTime;
        if (startTime !== existingPromotion.startTime) response.startTime = updatedPromotion.startTime;
        if (description !== existingPromotion.description) response.description = updatedPromotion.description;
        if (minSpending !== existingPromotion.minSpending && minSpending !== null) response.minSpending = updatedPromotion.minSpending;
        if (rate !== existingPromotion.rate && rate !== null) response.rate = updatedPromotion.rate;
        if (points !== existingPromotion.points && points !== null) response.points = updatedPromotion.points;

        return res.status(200).json(response);

    } catch (error) {
        console.error('Error updating promotion:', error);
        return res.status(500).json({ error: 'failed to update promotion' });
    }
});

// DELETE /promotions/:promotionId - Delete a promotion (Manager or higher)
app.delete('/promotions/:promotionId', authenticateUser, isManagerOrHigher, async (req, res) => {
    try {
        const { promotionId } = req.params;
        const id = parseInt(promotionId);

        if (isNaN(id)) {
            return res.status(400).json({ error: 'invalid promotion id' });
        }

        // Find the promotion
        const promotion = await prisma.promotion.findUnique({
            where: { id }
        });

        if (!promotion) {
            return res.status(404).json({ error: 'promotion not found' });
        }

        // Check if the promotion has already started
        if (new Date(promotion.startTime) <= new Date()) {
            return res.status(403).json({ error: 'cannot delete promotion that has already started' });
        }

        // Delete the promotion
        await prisma.promotion.delete({
            where: { id }
        });

        return res.status(204).send();

    } catch (error) {
        console.error('Error deleting promotion:', error);
        return res.status(500).json({ error: 'failed to delete promotion' });
    }
});

const server = app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

server.on('error', (err) => {
    console.error(`cannot start server: ${err.message}`);
    process.exit(1);
});