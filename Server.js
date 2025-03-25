import express from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import { authenticate } from "./auth.js"; // Assuming auth.js exists and is correctly implemented

// Initialize app and environment variables
dotenv.config();
const app = express();

// Middleware
app.use(cors()); // Allow cross-origin requests
app.use(bodyParser.json()); // Parse JSON requests
app.use(bodyParser.urlencoded({ extended: true })); // Parse URL-encoded requests

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Failed to connect to MongoDB:", err));

// Schemas and Models
const contactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  message: { type: String, required: true },
  submittedAt: { type: Date, default: Date.now },
});
const Contact = mongoose.model("Contact", contactSchema);

const bookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: { type: String, required: true },
  isbn: { type: String, unique: true, required: true },
  available: { type: Boolean, default: true },
});
const Book = mongoose.model("Book", bookSchema);

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  borrowedBooks: [{ type: mongoose.Schema.Types.ObjectId, ref: "Book" }],
});
const Student = mongoose.model("Student", studentSchema);

// Routes
app.get("/api/books", authenticate, async (req, res) => {
  try {
    const books = await Book.find();
    res.json(books);
  } catch (error) {
    console.error("Error fetching books:", error.message);
    res.status(500).json({ error: "Failed to fetch books" });
  }
});

app.post("/api/books", authenticate, async (req, res) => {
  try {
    const book = new Book(req.body);
    await book.save();
    res.status(201).json({ message: "Book saved successfully", book });
  } catch (error) {
    console.error("Error saving book:", error.message);
    res.status(500).json({ error: "Failed to save book" });
  }
});

app.get("/api/students", authenticate, async (req, res) => {
  try {
    const students = await Student.find().populate("borrowedBooks");
    res.json(students);
  } catch (error) {
    console.error("Error fetching students:", error.message);
    res.status(500).json({ error: "Failed to fetch students" });
  }
});

app.post("/api/students", authenticate, async (req, res) => {
  try {
    const student = new Student(req.body);
    await student.save();
    res.status(201).json({ message: "Student saved successfully", student });
  } catch (error) {
    console.error("Error saving student:", error.message);
    res.status(500).json({ error: "Failed to save student" });
  }
});

// Contact route
app.post("/api/contact", async (req, res) => {
  console.log("Received data:", req.body); // Debugging logs
  try {
    const contact = new Contact(req.body);
    await contact.save();
    res.status(201).json({ message: "Contact saved successfully", contact });
  } catch (error) {
    console.error("Error saving contact:", error.message);
    res.status(500).json({ error: "Failed to save contact", details: error.message });
  }
});

// Error handling for undefined routes
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
