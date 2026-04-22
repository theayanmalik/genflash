import { useState, useEffect, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
	Box,
	CardContent,
	Typography,
	Button,
	CircularProgress,
	useTheme,
} from "@mui/material"
import {
	ArrowBack,
	ArrowForward,
	FirstPage,
	GetApp,
	Home,
	Shuffle,
} from "@mui/icons-material"
import { createClient } from "@supabase/supabase-js"

// Initialize Supabase client
const supabaseUrl = "https://knrtgdrqmawdpdkzypxg.supabase.co"
const supabaseKey =
	"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtucnRnZHJxbWF3ZHBka3p5cHhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwMDk0ODIsImV4cCI6MjA2NDU4NTQ4Mn0.TNiMq_vY_ubSdW_VEQDlZz5-hwEjJ94930UhP_XiVPc"
const supabase = createClient(supabaseUrl, supabaseKey)

interface Flashcard {
	id?: string
	front: string
	back: string
	question?: string
	answer?: string
	position?: number
	set_id?: string
}

interface FlashcardsProps {
	flashcards?: Flashcard[]
	flashcardSetName?: string
}

function Flashcards({
	flashcards = [],
	flashcardSetName = "",
}: FlashcardsProps) {
	const theme = useTheme()
	const { id } = useParams<{ id: string }>()
	const navigate = useNavigate()
	const [loading, setLoading] = useState<boolean>(id ? true : false)
	const [error, setError] = useState<string | null>(null)
	const [loadedFlashcards, setLoadedFlashcards] = useState<Flashcard[]>([])
	const [setName, setSetName] = useState<string>("")

	const [currentIndex, setCurrentIndex] = useState(0)
	const [showAnswer, setShowAnswer] = useState(false)
	const [disableAnimation, setDisableAnimation] = useState(false)
	const flipCardRef = useRef<HTMLDivElement>(null)

	// Define styles with theme colors
	const styles = {
		flipCard: {
			backgroundColor: "transparent",
			width: "100%",
			height: "300px",
			perspective: "1000px",
			cursor: "pointer",
		},
		flipCardInner: {
			position: "relative",
			width: "100%",
			height: "100%",
			textAlign: "center",
			transition: "transform 0.6s",
			transformStyle: "preserve-3d",
		},
		flipCardInnerFlipped: {
			transform: "rotateY(180deg)",
		},
		flipCardInnerNoAnimation: {
			transition: "none",
		},
		flipCardFront: {
			position: "absolute",
			width: "100%",
			height: "100%",
			backfaceVisibility: "hidden",
			display: "flex",
			justifyContent: "center",
			alignItems: "center",
			borderRadius: "8px",
			boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
			backgroundColor: theme.palette.background.paper,
			border: `1px solid ${theme.palette.divider}`,
		},
		flipCardBack: {
			position: "absolute",
			width: "100%",
			height: "100%",
			backfaceVisibility: "hidden",
			display: "flex",
			justifyContent: "center",
			alignItems: "center",
			borderRadius: "8px",
			boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
			backgroundColor: theme.palette.background.paper,
			border: `1px solid ${theme.palette.divider}`,
			transform: "rotateY(180deg)",
		},
	}

	// Fetch flashcards when component mounts if we have an ID
	useEffect(() => {
		if (id) {
			fetchFlashcards()
		}
	}, [id])

	const fetchFlashcards = async () => {
		setLoading(true)
		try {
			// First get the set info to get the name
			const { data: setData, error: setError } = await supabase
				.from("flashcard_sets")
				.select("*")
				.eq("id", id)
				.single()

			if (setError) throw new Error(setError.message)
			if (!setData) throw new Error("Flashcard set not found")

			setSetName(setData.name || "")

			// Then get all flashcards for this set
			const { data: cardsData, error: cardsError } = await supabase
				.from("flashcards")
				.select("*")
				.eq("set_id", id)
				.order("position", { ascending: true })

			if (cardsError) throw new Error(cardsError.message)

			const formattedCards = (cardsData || []).map(card => ({
				id: card.id,
				front: card.question || "",
				back: card.answer || "",
				position: card.position,
				set_id: card.set_id,
			}))

			setLoadedFlashcards(formattedCards)
		} catch (err: any) {
			console.error("Error fetching flashcards:", err)
			setError(err.message)
		} finally {
			setLoading(false)
		}
	}

	const cards =
		flashcards.length > 0
			? flashcards
			: loadedFlashcards.length > 0
			? loadedFlashcards
			: [
					{
						front: "What is React?",
						back: "A JavaScript library for building user interfaces",
					},
					{
						front: "What is JSX?",
						back: "A syntax extension for JavaScript that looks similar to HTML",
					},
					{
						front: "What is a component?",
						back: "An independent, reusable piece of UI",
					},
			  ]

	const displayName = flashcardSetName || setName || "Flashcards"

	const handlePrevious = () => {
		setDisableAnimation(true)

		setShowAnswer(false)
		setCurrentIndex(prevIndex => (prevIndex - 1 + cards.length) % cards.length)
	}

	const handleNext = () => {
		setDisableAnimation(true)

		setShowAnswer(false)
		setCurrentIndex(prevIndex => (prevIndex + 1) % cards.length)
	}

	const toggleAnswer = () => {
		setDisableAnimation(false)
		setShowAnswer(!showAnswer)
	}

	useEffect(() => {
		const timer = setTimeout(() => {
			setDisableAnimation(false)
		}, 50)

		return () => clearTimeout(timer)
	}, [currentIndex])

	const handleReset = () => {
		setDisableAnimation(true)

		setShowAnswer(false)
		setCurrentIndex(0)
	}

	const handleShuffle = () => {
		const shuffled = [...cards].sort(() => Math.random() - 0.5)
		setLoadedFlashcards(shuffled)
		setCurrentIndex(0)
		setShowAnswer(false)
	}

	const handleDownload = () => {
		// Download flashcards as JSON
		const dataStr = JSON.stringify(
			{
				name: displayName,
				cards: cards,
			},
			null,
			2
		)
		const dataBlob = new Blob([dataStr], {
			type: "application/json",
		})
		const url = URL.createObjectURL(dataBlob)
		const a = document.createElement("a")
		a.href = url
		a.download = `${
			displayName.replace(/\s+/g, "_") || "flashcards"
		}_flashcards.json`
		a.click()
		URL.revokeObjectURL(url)
	}

	const handleBackToSets = () => {
		navigate("/sets")
	}

	if (loading) {
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

	if (error) {
		return (
			<Box sx={{ maxWidth: "600px", mx: "auto", mt: 4, px: 2 }}>
				<Typography variant="h6" color="error" gutterBottom>
					Error: {error}
				</Typography>
				<Button variant="contained" onClick={handleBackToSets}>
					Back to Sets
				</Button>
			</Box>
		)
	}

	return (
		<Box
			sx={{
				maxWidth: "800px",
				mx: "auto",
				mt: 4,
				mb: 8,
				px: 2,
				backgroundColor: theme.palette.background.default,
			}}
		>
			{/* Header */}
			<Box
				sx={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					mb: 4,
				}}
			>
				<Box>
					<Typography variant="h4" sx={{ fontWeight: "bold" }}>
						{displayName}
					</Typography>
					<Typography variant="subtitle1" color="text.secondary">
						({cards.length} cards)
					</Typography>
				</Box>

				<Button
					variant="outlined"
					startIcon={<Home />}
					onClick={handleBackToSets}
				>
					Back to Sets
				</Button>
			</Box>

			{cards.length > 0 ? (
				<>
					{/* Flashcard */}
					<Box sx={{ mb: 4 }}>
						<div
							ref={flipCardRef}
							onClick={toggleAnswer}
							style={{
								...styles.flipCard,
							}}
						>
							<div
								style={{
									...styles.flipCardInner as any,
									...(showAnswer ? styles.flipCardInnerFlipped : {}),
									...(disableAnimation ? styles.flipCardInnerNoAnimation : {}),
								}}
							>
								{/* Front side - Question */}
								<div style={styles.flipCardFront as any}>
									<CardContent
										sx={{
											textAlign: "center",
											width: "100%",
											p: 4,
											backgroundColor: "transparent",
										}}
									>
										<Typography variant="h5" sx={{ fontWeight: "medium" }}>
											{cards[currentIndex]?.front}
										</Typography>
										<Typography
											variant="body2"
											sx={{
												mt: 2,
												color: "text.secondary",
												fontStyle: "italic",
											}}
										>
											Click to flip
										</Typography>
									</CardContent>
								</div>

								{/* Back side - Answer */}
								<div style={styles.flipCardBack as any}>
									<CardContent
										sx={{
											textAlign: "center",
											width: "100%",
											p: 4,
											backgroundColor: "transparent",
										}}
									>
										<Typography variant="h5">
											{cards[currentIndex]?.back}
										</Typography>
										<Typography
											variant="body2"
											sx={{
												mt: 2,
												color: "text.secondary",
												fontStyle: "italic",
											}}
										>
											Click to flip
										</Typography>
									</CardContent>
								</div>
							</div>
						</div>
					</Box>

					{/* Card counter */}
					<Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
						<Typography variant="body1">
							Card {currentIndex + 1} of {cards.length}
						</Typography>
					</Box>

					{/* Navigation buttons */}
					<Box
						sx={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
							mb: 3,
						}}
					>
						<Button
							variant="contained"
							color="primary"
							onClick={handlePrevious}
							startIcon={<ArrowBack />}
							disabled={currentIndex === 0}
							sx={{ minWidth: "100px" }}
						>
							Previous
						</Button>

						<Button
							variant="contained"
							color="primary"
							onClick={handleNext}
							endIcon={<ArrowForward />}
							disabled={currentIndex === cards.length - 1}
							sx={{ minWidth: "100px" }}
						>
							Next
						</Button>
					</Box>

					<Box
						sx={{
							display: "flex",
							justifyContent: "center",
							gap: 2,
						}}
					>
						<Button
							variant="outlined"
							onClick={handleReset}
							startIcon={<FirstPage />}
							disabled={currentIndex === 0}
						>
							First Card
						</Button>

						<Button
							variant="outlined"
							onClick={handleShuffle}
							startIcon={<Shuffle />}
						>
							Shuffle
						</Button>

						<Button
							variant="outlined"
							onClick={handleDownload}
							startIcon={<GetApp />}
						>
							Download
						</Button>
					</Box>
				</>
			) : (
				<Box
					sx={{
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						gap: 2,
						mt: 8,
					}}
				>
					<Typography variant="h6">
						No flashcards available in this set.
					</Typography>
					<Button variant="contained" onClick={handleBackToSets}>
						Back to Sets
					</Button>
				</Box>
			)}
		</Box>
	)
}

export default Flashcards
