// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pkg from "pg";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import http from "http";
import { Server } from "socket.io";

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

// Authentication middleware that verifies the JWT
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

// Root endpoint
app.get("/", (req, res) => {
  res.json({ message: "Welcome to Suraksha-Bhandhu Backend API!" });
});

// Authentication routes
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existingUser = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );
    if (existingUser.rows.length > 0) {
      return res
        .status(400)
        .json({ error: "User already exists with that email." });
    }
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
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

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const userResult = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );
    if (userResult.rows.length === 0) {
      return res.status(400).json({ error: "Invalid email or password." });
    }
    const user = userResult.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid email or password." });
    }
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

// Emergency contacts route – now fetching user-specific contacts from the database.
// Make sure an "emergency_contacts" table exists with fields: contact_id, user_id, contact_name, etc.
app.get("/api/emergency", authenticateUser, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT contact_id, contact_name FROM emergency_contacts WHERE user_id = $1`,
      [req.userId]
    );
    // If no contacts are found, you may choose to return an empty list or fallback to a default dummy list.
    res.json(result.rows.length > 0 ? result.rows : []);
  } catch (error) {
    console.error("Error fetching emergency contacts:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

// Set up Socket.IO for chat functionality
const PORT = process.env.PORT || 3000;
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("authenticate", (userData) => {
    socket.userId = userData.userId;
    console.log(`Socket ${socket.id} authenticated as user ${socket.userId}`);
  });

  socket.on("joinRoom", (room) => {
    socket.join(room);
    console.log(`Socket ${socket.id} joined room ${room}`);
  });

  socket.on("chatMessage", async (data) => {
    console.log(
      `Message from ${socket.id} in room ${data.room}: ${data.message}`
    );
    try {
      await pool.query(
        `INSERT INTO messages (sender_id, room, message, latitude, longitude)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          data.senderId,
          data.room,
          data.message,
          data.latitude || null,
          data.longitude || null,
        ]
      );
    } catch (err) {
      console.error("Error saving message:", err);
    }
    io.to(data.room).emit("chatMessage", {
      sender: data.senderId,
      message: data.message,
      latitude: data.latitude,
      longitude: data.longitude,
    });
  });

  // When a socket disconnects, delete all messages sent by that user.
  socket.on("disconnect", async () => {
    console.log("User disconnected:", socket.id);
    if (socket.userId) {
      try {
        await pool.query("DELETE FROM messages WHERE sender_id = $1", [
          socket.userId,
        ]);
        console.log(`Deleted messages for user ${socket.userId}`);
      } catch (err) {
        console.error("Error deleting messages on disconnect:", err);
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

/*
  PostgreSQL Table Creation:

  -- Create table for messages
  CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    sender_id INTEGER NOT NULL,
    room VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- Example table for emergency_contacts (if not already in place):
  CREATE TABLE emergency_contacts (
    contact_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,  -- Link to the user's id in the users table
    contact_name VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(50)
  );
*/
