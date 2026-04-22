import express from "express"
import cors from "cors"
import multer from "multer"
import pdfParse from "pdf-parse"
import mammoth from "mammoth"
import dotenv from "dotenv"
import { GoogleGenerativeAI } from "@google/generative-ai"

dotenv.config()

// Gemini API
const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY || ""
)
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

const app = express()
const PORT = process.env.PORT || 8080

// CORS
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "http://localhost:5173",
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
)

app.use(express.json())

// File upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
})

app.get("/", (req, res) => {
  res.send("FlashcardProAI server is running!")
})

// 🔥 MAIN FLASHCARD API
app.post("/api/generate-flashcards", async (req, res) => {
  try {
    const { text, prompt, name } = req.body

    if (!text || !prompt) {
      return res.status(400).json({ error: "Missing required parameters" })
    }

    // System prompt
    const systemPrompt = `You are an expert teacher.

Convert the study material into high-quality flashcards.

Requirements:
- Cover ALL important concepts
- Include definitions, relationships, and examples
- Avoid repetition

Return ONLY valid JSON (no extra text):

[
  {
    "question": "...",
    "answer": "...",
    "difficulty": "easy | medium | hard"
  }
]`

    const fullPrompt = `${systemPrompt}

User prompt: ${prompt}

Content:
${text.substring(0, 5000)}`

    console.log("Calling Gemini API...")

    const result = await model.generateContent(fullPrompt)
    const response = await result.response
    const responseText = response.text()

    let flashcards: any

    try {
      // Extract JSON safely
      const jsonRegex =
        /```(?:json)?\s*(\[[\s\S]*?\])\s*```|(\[[\s\S]*?\])/
      const match = responseText.match(jsonRegex)

      if (match && (match[1] || match[2])) {
        flashcards = JSON.parse(match[1] || match[2])
      } else {
        flashcards = JSON.parse(responseText)
      }

      // ✅ VALIDATE (question/answer format)
      if (
        !Array.isArray(flashcards) ||
        !flashcards.every(
          (card: any) =>
            typeof card === "object" &&
            "question" in card &&
            "answer" in card
        )
      ) {
        throw new Error("Invalid flashcard format")
      }

      // ✅ CONVERT → frontend format
      flashcards = flashcards.map((card: any) => ({
        front: card.question,
        back: card.answer,
        difficulty: card.difficulty || "medium",
      }))
    } catch (error) {
      console.error("Failed to parse flashcards:", error, responseText)
      return res.status(500).json({
        error: "Failed to generate valid flashcards",
        rawResponse: responseText,
      })
    }

    res.json({
      flashcards,
      name,
      count: flashcards.length,
    })
  } catch (error: any) {
    console.error("Error generating flashcards:", error)
    res.status(500).json({
      error: "Failed to generate flashcards",
      details: error.message,
    })
  }
})

// 📄 TEXT EXTRACTION
app.post("/api/extract-text", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" })
  }

  try {
    let text = ""
    const fileType = req.file.mimetype

    if (fileType === "application/pdf") {
      const data = await pdfParse(req.file.buffer)
      text = data.text
    } else if (
      fileType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      const result = await mammoth.extractRawText({ buffer: req.file.buffer })
      text = result.value
    } else {
      return res.status(400).json({
        error: "Only PDF or DOCX allowed",
      })
    }

    res.json({ text })
  } catch (err) {
    console.error("Text extraction error:", err)
    res.status(500).json({ error: "Failed to extract text" })
  }
})

// 📄 PDF UPLOAD
app.post("/api/upload-pdf", upload.single("pdf"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" })
  }

  try {
    const data = await pdfParse(req.file.buffer)
    res.json({ text: data.text })
  } catch (err) {
    console.error("PDF parse error:", err)
    res.status(500).json({ error: "Failed to parse PDF" })
  }
})

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`)
})