// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pkg from "pg";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import twilio from "twilio";
import http from "http";

dotenv.config();

const { Pool } = pkg;
const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
});

// Initialize Twilio client
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;
const twilioClient = twilio(accountSid, authToken);

const app = express();
app.use(cors());
app.use(express.json());

// -------------------- Authentication Middleware --------------------
const authenticateUser = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token)
      return res.status(401).json({ error: "Authentication required" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const userCheck = await pool.query("SELECT id FROM users WHERE id = $1", [
      decoded.userId,
    ]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    req.userId = decoded.userId;
    next();
  } catch (error) {
    console.error("Token verification error:", error);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

// -------------------- Routes --------------------
app.get("/", (req, res) => {
  res.json({ message: "Welcome to Suraksha-Bhandhu Backend API!" });
});

// Auth routes
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existingUser = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );
    if (existingUser.rows.length > 0)
      return res.status(400).json({ error: "User exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await pool.query(
      `INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email`,
      [name, email, hashedPassword]
    );
    res
      .status(201)
      .json({ message: "User registered!", user: newUser.rows[0] });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const userResult = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );
    if (userResult.rows.length === 0)
      return res.status(400).json({ error: "Invalid credentials" });

    const user = userResult.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

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
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/emergency", authenticateUser, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM emergency_contacts WHERE user_id = $1",
      [req.userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Emergency contacts error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/emergency", authenticateUser, async (req, res) => {
  try {
    const userCheck = await pool.query("SELECT id FROM users WHERE id = $1", [
      req.userId,
    ]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const { contact_id, contact_name, contact_number } = req.body;
    if (!contact_id || !contact_name || !contact_number)
      return res.status(400).json({ error: "Missing fields" });

    const existing = await pool.query(
      "SELECT id FROM emergency_contacts WHERE user_id = $1 AND contact_id = $2",
      [req.userId, contact_id.toString()]
    );

    if (existing.rows.length > 0) {
      await pool.query("DELETE FROM emergency_contacts WHERE id = $1", [
        existing.rows[0].id,
      ]);
      return res.json({ message: "Contact removed" });
    }

    const result = await pool.query(
      `INSERT INTO emergency_contacts (user_id, contact_id, contact_name, contact_number)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.userId, contact_id.toString(), contact_name, contact_number]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Emergency contact error:", error);
    res
      .status(500)
      .json({
        error: error.code === "23505" ? "Contact exists" : "Server error",
      });
  }
});

// -------------------- Message Persistence Endpoints --------------------

// Endpoint to save a new message
app.post("/api/messages", authenticateUser, async (req, res) => {
  try {
    const { contact_id, type, content } = req.body;
    const result = await pool.query(
      `INSERT INTO messages (user_id, contact_id, type, content)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.userId, contact_id, type, content]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Message save error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Endpoint to fetch messages for a given contact
app.get("/api/messages/:contact_id", authenticateUser, async (req, res) => {
  try {
    const { contact_id } = req.params;
    const result = await pool.query(
      "SELECT * FROM messages WHERE user_id = $1 AND contact_id = $2 ORDER BY timestamp ASC",
      [req.userId, contact_id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Message fetch error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
const server = http.createServer(app); // Create the HTTP server using Express app

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

server.on('error', (error) => {
  console.error('Server encountered an error:', error);
});
