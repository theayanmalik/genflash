import { useState, useEffect } from "react"
import {
	Box,
	Button,
	Container,
	FormControl,
	Snackbar,
	Stack,
	TextField,
	Typography,
	Alert,
	Paper,
	CircularProgress,
	useTheme,
} from "@mui/material"
import SaveIcon from "@mui/icons-material/Save"
import Flashcards from "./Flashcards"
import { supabase } from "./supabaseClient"
import { useNavigate } from "react-router-dom"

function Upload() {
	const theme = useTheme()
	const [file, setFile] = useState<File | null>(null)
	const [flashcardSetName, setFlashcardSetName] = useState("")
	const [extractedText, setExtractedText] = useState<string>("")
	const [isExtracting, setIsExtracting] = useState(false)
	const [flashcards, setFlashcards] = useState<
		{ front: string; back: string }[]
	>([])
	const [isGenerating, setIsGenerating] = useState(false)
	const [isSaving, setIsSaving] = useState(false)
	const [user, setUser] = useState<any>(null)
	const [isLoading, setIsLoading] = useState(true)
	const navigate = useNavigate()
	const [toast, setToast] = useState<{
		open: boolean
		message: string
		severity: "success" | "info" | "warning" | "error"
	}>({
		open: false,
		message: "",
		severity: "info",
	})

	// Check authentication when component loads
	useEffect(() => {
		const checkAuth = async () => {
			const {
				data: { session },
			} = await supabase.auth.getSession()

			if (!session) {
				// Redirect unauthenticated users
				setToast({
					open: true,
					message: "You must be logged in to create flashcards",
					severity: "error",
				})

				// Redirect after showing toast briefly
				setTimeout(() => {
					navigate("/login")
				}, 2000)

				return
			}

			setUser(session.user)
			setIsLoading(false)
		}

		checkAuth()
	}, [navigate])

	const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const selectedFile = e.target.files?.[0]
		if (selectedFile) {
			// Check if the file is a PDF or DOCX
			const fileType = selectedFile.type
			if (
				fileType === "application/pdf" ||
				fileType ===
					"application/vnd.openxmlformats-officedocument.wordprocessingml.document"
			) {
				setFile(selectedFile)
				setIsExtracting(true)
				setExtractedText("")
				setFlashcards([])

				try {
					// Create form data to send the file
					const formData = new FormData()
					formData.append("file", selectedFile)

					const response = await fetch(
						"https://genflash.onrender.com/api/extract-text",
						{
							method: "POST",
							body: formData,
						}
					)

					if (!response.ok) {
						const errorData = await response.json().catch(() => ({}))
						throw new Error(errorData.error || "Failed to extract text")
					}

					const data = await response.json()
					setExtractedText(data.text)

					setToast({
						open: true,
						message: "Text extracted successfully!",
						severity: "success",
					})
				} catch (error: any) {
					console.error("Error extracting text:", error)
					setToast({
						open: true,
						message: error.message || "Error extracting text from file.",
						severity: "error",
					})
					// For demo purposes, remove this in production
					if (process.env.NODE_ENV === "development") {
						setExtractedText(
							"Sample extracted text. In a real app, this would be the text from your document."
						)
					}
				} finally {
					setIsExtracting(false)
				}
			} else {
				setToast({
					open: true,
					message: "Please upload a PDF or DOCX file.",
					severity: "error",
				})
			}
		}
	}

	const handleGenerateFlashcards = async () => {
		if (!file) {
			setToast({
				open: true,
				message: "Please upload a file first.",
				severity: "warning",
			})
			return
		}

		if (!flashcardSetName.trim()) {
			setToast({
				open: true,
				message: "Please enter a name for your flashcard set.",
				severity: "warning",
			})
			return
		}

		if (!extractedText || extractedText.trim().length === 0) {
			setToast({
				open: true,
				message: "No text was extracted from the file.",
				severity: "warning",
			})
			return
		}

		// Default prompt to use for flashcard generation
		const defaultPrompt =
			"Create flashcards with questions on one side and concise but comprehensive answers on the other"

		setIsGenerating(true)
		setFlashcards([])

		try {
			setToast({
				open: true,
				message: "Generating flashcards... This may take a moment.",
				severity: "info",
			})

			// Call the backend to generate flashcards
			const response = await fetch(
				"https://genflash.onrender.com/api/generate-flashcards",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						text: extractedText,
						prompt: defaultPrompt,
						name: flashcardSetName,
					}),
				}
			)

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}))
				throw new Error(errorData.error || "Failed to generate flashcards")
			}

			const data = await response.json()
			setFlashcards(data.flashcards)

			setToast({
				open: true,
				message: `Successfully generated ${data.flashcards.length} flashcards!`,
				severity: "success",
			})
		} catch (error: any) {
			console.error("Error generating flashcards:", error)
			setToast({
				open: true,
				message: error.message || "Error generating flashcards.",
				severity: "error",
			})
		} finally {
			setIsGenerating(false)
		}
	}

	const saveFlashcardsToSupabase = async () => {
		if (flashcards.length === 0) {
			setToast({
				open: true,
				message: "No flashcards to save.",
				severity: "warning",
			})
			return
		}

		setIsSaving(true)

		try {
			// Check if user is still authenticated
			if (!user) {
				const {
					data: { session },
				} = await supabase.auth.getSession()
				if (!session) {
					throw new Error("You must be logged in to save flashcards")
				}
				setUser(session.user)
			}

			// 1. Create the flashcard set with the user's ID
			const { data: setData, error: setError } = await supabase
				.from("flashcard_sets")
				.insert({
					name: flashcardSetName,
					favorite: false,
					tags: [
						file?.type.includes("pdf") ? "PDF" : "Document",
						"AI Generated",
					],
					// Associate with the current user
					user_id: user.id,
				})
				.select()

			if (setError) throw new Error(setError.message)
			if (!setData || setData.length === 0)
				throw new Error("Failed to create flashcard set")

			const setId = setData[0].id

			// 2. Then create all the individual flashcards
			const flashcardsToInsert = flashcards.map((card: any, index: number) => ({
				set_id: setId,
				question: card.front,
				answer: card.back,
				position: index,
			}))

			const { error: cardsError } = await supabase
				.from("flashcards")
				.insert(flashcardsToInsert)

			if (cardsError) throw new Error(cardsError.message)

			// Success and redirect to Sets page
			setToast({
				open: true,
				message: `${flashcards.length} flashcards saved successfully!`,
				severity: "success",
			})

			// Wait briefly then redirect to the Sets page
			setTimeout(() => {
				navigate("/sets")
			}, 1500)
		} catch (error: any) {
			console.error("Error saving flashcards to Supabase:", error)
			setToast({
				open: true,
				message: `Failed to save flashcards: ${error.message}`,
				severity: "error",
			})
		} finally {
			setIsSaving(false)
		}
	}

	const handleCloseToast = () => {
		setToast({ ...toast, open: false })
	}

	// Show loading while checking auth
	if (isLoading) {
		return (
			<Box
				sx={{
					display: "flex",
					justifyContent: "center",
					alignItems: "center",
					height: "80vh",
				}}
			>
				<CircularProgress />
			</Box>
		)
	}

	return (
		<Container maxWidth="md" sx={{ py: 5 }}>
			<Stack spacing={4}>
				<Typography variant="h4" component="h1" align="center">
					Upload Documents for Flashcards
				</Typography>

				<Box
					sx={{
						border: "2px dashed",
						borderColor: "grey.300",
						borderRadius: 1,
						p: 5,
						textAlign: "center",
						"&:hover": { borderColor: "primary.main" },
					}}
				>
					<input
						type="file"
						id="file-upload"
						onChange={handleFileChange}
						accept=".pdf,.docx"
						style={{ display: "none" }}
					/>
					<label htmlFor="file-upload">
						<Button variant="contained" component="span" sx={{ mb: 2 }}>
							Choose PDF or DOCX
						</Button>
					</label>
					{file ? (
						<Typography sx={{ mt: 2 }}>Selected: {file.name}</Typography>
					) : (
						<Typography color="text.secondary">
							Drag and drop a file or click to select
						</Typography>
					)}
				</Box>

				{isExtracting ? (
					<Box sx={{ display: "flex", justifyContent: "center", my: 3 }}>
						<CircularProgress />
						<Typography sx={{ ml: 2 }}>Extracting text...</Typography>
					</Box>
				) : (
					file && (
						<Box sx={{ mt: 3 }}>
							<Box
								sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}
							>
								<Typography variant="h6" gutterBottom>
									Extracted Text
								</Typography>
								{extractedText && (
									<Typography variant="body2" color="text.secondary">
										{extractedText.length.toLocaleString()} characters
									</Typography>
								)}
							</Box>
							<Paper
								sx={{
									p: 2,
									maxHeight: "300px",
									overflowY: "auto",
									bgcolor: theme.palette.background.paper, // Updated to use theme color
									border: `1px solid ${theme.palette.divider}`, // Updated border color
									borderRadius: 1,
									fontFamily: "monospace",
								}}
							>
								{extractedText ? (
									<Typography
										sx={{
											whiteSpace: "pre-wrap",
											fontSize: "0.9rem",
											color: theme.palette.text.primary, // Updated text color
										}}
									>
										{extractedText}
									</Typography>
								) : (
									<Typography color="text.secondary" align="center">
										No text could be extracted from this file.
									</Typography>
								)}
							</Paper>
						</Box>
					)
				)}

				<FormControl fullWidth>
					<TextField
						label="Flashcard Set Name"
						placeholder="Enter a name for your flashcard set"
						required
						inputProps={{ maxLength: 100 }}
						helperText="Give your flashcards a memorable name (required)"
						onChange={e => setFlashcardSetName(e.target.value)}
						value={flashcardSetName}
					/>
				</FormControl>

				<Button
					variant="contained"
					color="success"
					size="large"
					onClick={handleGenerateFlashcards}
					disabled={
						!file || !flashcardSetName.trim() || isExtracting || isGenerating
					}
					fullWidth
				>
					{isGenerating ? (
						<>
							<CircularProgress size={24} color="inherit" sx={{ mr: 1 }} />
							Generating Flashcards...
						</>
					) : (
						"Generate Flashcards"
					)}
				</Button>

				{/* Display flashcards with Save button */}
				{flashcards.length > 0 && (
					<>
						<Flashcards
							flashcards={flashcards}
							flashcardSetName={flashcardSetName}
						/>

						{/* Save button */}
						<Button
							variant="contained"
							color="primary"
							startIcon={<SaveIcon />}
							size="large"
							onClick={saveFlashcardsToSupabase}
							disabled={isSaving}
							fullWidth
							sx={{ mt: 3 }}
						>
							{isSaving ? (
								<>
									<CircularProgress size={24} color="inherit" sx={{ mr: 1 }} />
									Saving Flashcards...
								</>
							) : (
								"Save to My Collection"
							)}
						</Button>
					</>
				)}
			</Stack>

			<Snackbar
				open={toast.open}
				autoHideDuration={3000}
				onClose={handleCloseToast}
				anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
			>
				<Alert onClose={handleCloseToast} severity={toast.severity}>
					{toast.message}
				</Alert>
			</Snackbar>
		</Container>
	)
}

export default Upload
