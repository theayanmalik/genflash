# 🚀 GenFlash

**AI-Powered Flashcard Generator for Smart Learning**

GenFlash is a full-stack web application that transforms study materials into structured flashcards using AI. It is designed to help students learn faster, revise efficiently, and retain concepts through active recall.

---

## 🧠 Overview

Instead of manually creating flashcards, GenFlash automates the process:

- Upload your notes (PDF/DOCX) or paste text  
- AI analyzes the content  
- Generates high-quality flashcards instantly  
- Save and revisit anytime  

This reduces effort and improves learning efficiency.

---

## ✨ Key Features

- 📄 **File Upload Support**  
  Upload PDF or DOCX files and extract study content automatically  

- 🤖 **AI Flashcard Generation**  
  Uses Google Gemini to generate structured, concept-focused flashcards  

- 🧾 **Smart Flashcard Sets**  
  Organize flashcards into sets for different subjects/topics  

- ⭐ **Save & Manage**  
  Save, edit, delete, and revisit your flashcards anytime  

- 🔐 **Authentication**  
  Secure login/signup using Supabase  

- 📱 **Responsive UI**  
  Works smoothly across desktop and mobile devices  

---

## 🏗️ Tech Stack

### Frontend
- React (TypeScript)
- Material UI (MUI)
- Tailwind CSS

### Backend
- Node.js
- Express.js

### AI Integration
- Google Gemini API

### Database & Auth
- Supabase (PostgreSQL + Authentication)

---

## ⚙️ How It Works

1. User uploads study material or enters text  
2. Backend processes content  
3. Gemini AI generates structured flashcards  
4. Flashcards are displayed and stored in database  
5. User can review anytime  

---

## 🛠️ Local Setup

### 1️⃣ Clone the repository

```bash
git clone https://github.com/yourusername/genflash.git
cd genflash