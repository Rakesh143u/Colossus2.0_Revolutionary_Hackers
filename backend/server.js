// server.js

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pkg from "pg";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

dotenv.config();

const { Pool } = pkg;
const pool = new Pool({
  host: process.env.DB_HOST, // e.g., "localhost"
  user: process.env.DB_USER, // e.g., "your_db_user"
  password: process.env.DB_PASSWORD, // e.g., "your_db_password"
  database: process.env.DB_NAME, // e.g., "your_db_name"
  port: process.env.DB_PORT, // e.g., 5432
});

const app = express();
app.use(cors());
app.use(express.json());

/**
 * Middleware: authenticateUser
 * Extracts the JWT token from the Authorization header,
 * verifies it, and attaches the userId to req.userId.
 */
const authenticateUser = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Authentication required" });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    console.error("Token verification error:", error);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

// -------------------- Root Endpoint --------------------
app.get("/", (req, res) => {
  res.json({ message: "Welcome to Suraksha-Bhandhu Backend API!" });
});

// -------------------- Auth Routes --------------------

/**
 * POST /api/auth/signup
 * Registers a new user.
 */
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user exists
    const existingUser = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );
    if (existingUser.rows.length > 0) {
      return res
        .status(400)
        .json({ error: "User already exists with that email." });
    }

    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert new user
    const newUser = await pool.query(
      `INSERT INTO users (name, email, password)
       VALUES ($1, $2, $3)
       RETURNING id, name, email`,
      [name, email, hashedPassword]
    );

    res.status(201).json({
      message: "User registered successfully!",
      user: newUser.rows[0],
    });
  } catch (error) {
    console.error("Error in /api/auth/signup route:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

/**
 * POST /api/auth/login
 * Logs in a user and returns a JWT token.
 */
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Fetch user by email
    const userResult = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );
    if (userResult.rows.length === 0) {
      return res.status(400).json({ error: "Invalid email or password." });
    }

    const user = userResult.rows[0];

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid email or password." });
    }

    // Sign JWT including userId inside the token payload
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      message: "Login successful",
      user: { id: user.id, name: user.name, email: user.email },
      token,
    });
  } catch (error) {
    console.error("Error in /api/auth/login route:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

// -------------------- Emergency Contacts Routes --------------------

/**
 * POST /api/emergency
 * Toggles an emergency contact for the authenticated user.
 */
app.post("/api/emergency", authenticateUser, async (req, res) => {
  const userId = req.userId;
  const { contact_id, contact_name, contact_number } = req.body;

  try {
    // Check if the contact exists as an emergency contact for this user.
    const existing = await pool.query(
      "SELECT * FROM emergency_contacts WHERE user_id = $1 AND contact_id = $2",
      [userId, contact_id]
    );

    if (existing.rows.length > 0) {
      // Remove if it exists
      await pool.query(
        "DELETE FROM emergency_contacts WHERE user_id = $1 AND contact_id = $2",
        [userId, contact_id]
      );
      return res.json({ message: "Removed from emergency contacts." });
    } else {
      // Otherwise, add as emergency contact.
      await pool.query(
        `INSERT INTO emergency_contacts (user_id, contact_id, contact_name, contact_number)
         VALUES ($1, $2, $3, $4)`,
        [userId, contact_id, contact_name, contact_number]
      );
      return res.json({ message: "Added to emergency contacts." });
    }
  } catch (error) {
    console.error("Emergency contact toggle error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/emergency
 * Retrieves all emergency contacts for the authenticated user.
 */
app.get("/api/emergency", authenticateUser, async (req, res) => {
  const userId = req.userId;
  try {
    const result = await pool.query(
      "SELECT contact_id, contact_name, contact_number FROM emergency_contacts WHERE user_id = $1",
      [userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Fetching emergency contacts error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// -------------------- Start Server --------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
