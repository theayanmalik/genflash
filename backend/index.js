import express from "express"
import cors from "cors"
import multer from "multer"
import pdfParse from "pdf-parse/lib/pdf-parse.js"
import mammoth from "mammoth"
import dotenv from "dotenv"
import { GoogleGenerativeAI } from "@google/generative-ai"

dotenv.config()

// Gemini API
const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY || ""
)
const model = genAI.getGenerativeModel({ model: "gemini-1.0-pro" })

const app = express()
const PORT = process.env.PORT || 8080

app.use(cors())
app.use(express.json())

// File upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
})

// Health check
app.get("/", (req, res) => {
  res.send("FlashcardProAI server is running!")
})


// 🔥 GENERATE FLASHCARDS
app.post("/api/generate-flashcards", async (req, res) => {
  try {
    const { text, prompt, name } = req.body

    if (!text || !prompt) {
      return res.status(400).json({ error: "Missing required parameters" })
    }

    const systemPrompt = `You are an expert teacher.

Convert the study material into high-quality flashcards.

Return ONLY JSON:
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

    const result = await model.generateContent({
  contents: [
    {
      role: "user",
      parts: [{ text: fullPrompt }]
    }
  ]
})
    const response = await result.response
    const responseText = response.text()

    let flashcards

    try {
      const jsonRegex =
        /```(?:json)?\s*(\[[\s\S]*?\])\s*```|(\[[\s\S]*?\])/
      const match = responseText.match(jsonRegex)

      if (match && (match[1] || match[2])) {
        flashcards = JSON.parse(match[1] || match[2])
      } else {
        flashcards = JSON.parse(responseText)
      }

      if (!Array.isArray(flashcards)) {
        throw new Error("Invalid format")
      }

      flashcards = flashcards.map((card) => ({
        front: card.question,
        back: card.answer,
        difficulty: card.difficulty || "medium",
      }))
    } catch (error) {
      console.error("Parse error:", error, responseText)
      return res.status(500).json({
        error: "Failed to generate valid flashcards",
      })
    }

    res.json({
      flashcards,
      name,
      count: flashcards.length,
    })
  } catch (error) {
    console.error("Generation error:", error)
  res.status(500).json({
  error: "Failed to generate flashcards",
  details: error.message,
    })
  }
})


// 📄 EXTRACT TEXT
app.post("/api/extract-text", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" })
    }

    let text = ""
    const fileType = req.file.mimetype

    if (fileType === "application/pdf") {
      const data = await pdfParse(req.file.buffer)
      text = data.text
    } else if (
      fileType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      const result = await mammoth.extractRawText({
        buffer: req.file.buffer,
      })
      text = result.value
    } else {
      return res.status(400).json({
        error: "Only PDF or DOCX allowed",
      })
    }

    res.json({ text })
  } catch (error) {
    console.error("Extraction error:", error)
    res.status(500).json({ error: "Failed to extract text" })
  }
})


// 📄 PDF UPLOAD (optional)
app.post("/api/upload-pdf", upload.single("pdf"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" })
    }

    const data = await pdfParse(req.file.buffer)
    res.json({ text: data.text })
  } catch (error) {
    console.error("PDF parse error:", error)
    res.status(500).json({ error: "Failed to parse PDF" })
  }
})


// START SERVER
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`)
})