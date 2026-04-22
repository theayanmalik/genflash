import React, { useState, useEffect } from "react"
import {
	Container,
	Typography,
	Grid,
	Card,
	CardContent,
	CardActions,
	Button,
	Box,
	CircularProgress,
	Divider,
	Chip,
	IconButton,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogContentText,
	DialogActions,
	Snackbar,
	Alert,
} from "@mui/material"
import DeleteIcon from "@mui/icons-material/Delete"
// import EditIcon from "@mui/icons-material/Edit"
import StarIcon from "@mui/icons-material/Star"
import StarBorderIcon from "@mui/icons-material/StarBorder"
import { useNavigate } from "react-router-dom"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = "https://knrtgdrqmawdpdkzypxg.supabase.co"
const supabaseKey =
	"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtucnRnZHJxbWF3ZHBka3p5cHhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwMDk0ODIsImV4cCI6MjA2NDU4NTQ4Mn0.TNiMq_vY_ubSdW_VEQDlZz5-hwEjJ94930UhP_XiVPc"
const supabase = createClient(supabaseUrl, supabaseKey)

function Sets() {
	const [sets, setSets] = useState<any[]>([])
	const [loading, setLoading] = useState<boolean>(true)
	const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false)
	const [setToDelete, setSetToDelete] = useState<string | null>(null)
	const [user, setUser] = useState<any>(null)
	const navigate = useNavigate()
	const [notification, setNotification] = useState<{
		open: boolean
		message: string
		type: "success" | "error"
	}>({
		open: false,
		message: "",
		type: "success",
	})

	// check if the user is authenticated
	useEffect(() => {
		async function checkAuth() {
			const {
				data: { session },
			} = await supabase.auth.getSession()
			if (!session) {
				// Redirect to login if not authenticated
				navigate("/login")
				return
			}

			setUser(session.user)
			// After confirming authentication, fetch the sets
			fetchSets(session.user.id)
		}

		checkAuth()
	}, [navigate])

	const fetchSets = async (userId: string) => {
		setLoading(true)
		try {
			// Only fetch flashcard sets for the current user
			const { data: flashcardSets, error } = await supabase
				.from("flashcard_sets")
				.select("*, flashcards(count)")
				.eq("user_id", userId)
				.order("created_at", { ascending: false })

			if (error) throw error

			if (flashcardSets && flashcardSets.length > 0) {
				const formattedSets = await Promise.all(
					flashcardSets.map(async set => {
						// Get count of flashcards for this set
						const { count, error: countError } = await supabase
							.from("flashcards")
							.select("*", { count: "exact", head: true })
							.eq("set_id", set.id)

						if (countError)
							console.error("Error getting card count:", countError)

						return {
							id: set.id,
							title: set.name,
							cards: count || 0,
							lastModified: set.created_at,
							favorite: set.favorite || false,
							tags: set.tags || [],
						}
					})
				)

				setSets(formattedSets)
			} else {
				setSets([])
			}
		} catch (error) {
			console.error("Error fetching flashcard sets:", error)
		} finally {
			setLoading(false)
		}
	}

	const handleViewSet = (id: string) => {
		navigate(`/flashcards/${id}`)
	}

	const handleEditSet = (id: string, e: React.MouseEvent) => {
		e.stopPropagation()
		navigate(`/flashcards/${id}/edit`)
	}

	const handleDeleteClick = (id: string, e: React.MouseEvent) => {
		e.stopPropagation()
		setSetToDelete(id)
		setDeleteDialogOpen(true)
	}

	const confirmDelete = async () => {
		if (setToDelete !== null) {
			try {
				// Delete from Supabase
				const { error } = await supabase
					.from("flashcard_sets")
					.delete()
					.eq("id", setToDelete)
					.eq("user_id", user.id) // ensure users can only delete their own sets

				if (error) throw error

				// Update UI
				setSets(sets.filter(set => set.id !== setToDelete))
				setNotification({
					open: true,
					message: "Flashcard set deleted successfully",
					type: "success",
				})
			} catch (error) {
				console.error("Error deleting set:", error)
				setNotification({
					open: true,
					message: "Failed to delete flashcard set",
					type: "error",
				})
			} finally {
				setDeleteDialogOpen(false)
				setSetToDelete(null)
			}
		}
	}

	const toggleFavorite = async (id: string, e: React.MouseEvent) => {
		e.stopPropagation()

		// Find current set to get its current favorite status
		const currentSet = sets.find(set => set.id === id)
		if (!currentSet) return

		const newFavoriteStatus = !currentSet.favorite

		// Optimistically update UI
		setSets(
			sets.map(set =>
				set.id === id ? { ...set, favorite: newFavoriteStatus } : set
			)
		)

		try {
			// Update in Supabase
			const { error } = await supabase
				.from("flashcard_sets")
				.update({ favorite: newFavoriteStatus })
				.eq("id", id)
				.eq("user_id", user.id)

			if (error) throw error
		} catch (error) {
			console.error("Error updating favorite status:", error)

			// Revert UI on error
			setSets(
				sets.map(set =>
					set.id === id ? { ...set, favorite: currentSet.favorite } : set
				)
			)

			setNotification({
				open: true,
				message: "Failed to update favorite status",
				type: "error",
			})
		}
	}

	// Add a proper sign out handler in Sets component
	// const handleSignOut = async () => {
	// 	try {
	// 		setLoading(true)
	// 		// Sign out from Supabase
	// 		const { error } = await supabase.auth.signOut()

	// 		if (error) throw error

	// 		// Clear user state
	// 		setUser(null)

	// 		// Show notification - though user will likely be redirected before seeing it
	// 		setNotification({
	// 			open: true,
	// 			message: "Signed out successfully",
	// 			type: "success",
	// 		})

	// 		// Redirect to home page
	// 		navigate("/")
	// 	} catch (error) {
	// 		console.error("Error signing out:", error)
	// 		setNotification({
	// 			open: true,
	// 			message: "Failed to sign out",
	// 			type: "error",
	// 		})
	// 	} finally {
	// 		setLoading(false)
	// 	}
	// }

	const handleCreateNew = () => {
		navigate("/upload")
	}

	const handleCloseNotification = () => {
		setNotification({ ...notification, open: false })
	}

	if (loading) {
		return (
			<Box
				sx={{
					display: "flex",
					justifyContent: "center",
					alignItems: "center",
					height: "70vh",
				}}
			>
				<CircularProgress />
			</Box>
		)
	}

	return (
		<Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
			<Box
				sx={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					mb: 4,
				}}
			>
				<Typography variant="h4" component="h1">
					My Flashcard Sets
				</Typography>
				<Button variant="contained" color="primary" onClick={handleCreateNew}>
					Create New Set
				</Button>
			</Box>

			{sets.length === 0 ? (
				<Box
					sx={{
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						justifyContent: "center",
						height: "50vh",
						textAlign: "center",
					}}
				>
					<Typography variant="h6" sx={{ mb: 2 }}>
						You haven't created any flashcard sets yet
					</Typography>
					<Button variant="contained" color="primary" onClick={handleCreateNew}>
						Create Your First Set
					</Button>
				</Box>
			) : (
				<Grid container spacing={3}>
					{sets.map(set => (
						<Box
							key={set.id}
							sx={{
								width: { xs: "100%", sm: "50%", md: "33.33%" }, // Responsive columns
								boxSizing: "border-box",
								p: 1, // Add some padding between cards
								display: "flex",
							}}
						>
							<Card
								sx={{
									height: "280px", // Fixed height for all cards
									display: "flex",
									flexDirection: "column",
									cursor: "pointer",
									transition: "transform 0.2s, box-shadow 0.2s",
									"&:hover": {
										transform: "translateY(-4px)",
										boxShadow: "0 6px 12px rgba(0,0,0,0.15)",
									},
									width: "100%", // Ensure full width within box
								}}
								onClick={() => handleViewSet(set.id)}
							>
								<CardContent
									sx={{
										flexGrow: 1,
										overflow: "hidden", // Prevent content overflow
										display: "flex",
										flexDirection: "column",
										padding: "16px", // Consistent padding
										"&:last-child": { paddingBottom: "16px" }, // Override MUI's default
									}}
								>
									<Box
										sx={{
											display: "flex",
											justifyContent: "space-between",
											alignItems: "flex-start",
										}}
									>
										<Typography
											variant="h6"
											component="h2"
											noWrap
											sx={{ maxWidth: "80%" }}
										>
											{set.title}
										</Typography>
										<IconButton
											size="small"
											onClick={e => toggleFavorite(set.id, e)}
											color={set.favorite ? "warning" : "default"}
										>
											{set.favorite ? <StarIcon /> : <StarBorderIcon />}
										</IconButton>
									</Box>
									<Typography
										variant="body2"
										color="text.secondary"
										sx={{ mt: 1 }}
									>
										{set.cards} cards
									</Typography>
									<Typography
										variant="body2"
										color="text.secondary"
										sx={{ mt: 0.5 }}
									>
										Last modified:{" "}
										{new Date(set.lastModified).toLocaleDateString()}
									</Typography>
									<Box
										sx={{
											mt: 2,
											display: "flex",
											flexWrap: "wrap",
											gap: 0.5,
											overflow: "hidden",
											maxHeight: "80px", // Limit tag area height
										}}
									>
										{set.tags &&
											set.tags.map((tag: string) => (
												<Chip
													key={tag}
													label={tag}
													size="small"
													color="primary"
													variant="outlined"
													onClick={e => e.stopPropagation()}
												/>
											))}
									</Box>
									<Box sx={{ flexGrow: 1 }} />{" "}
									{/* Push action area to bottom */}
								</CardContent>

								<Divider />

								<CardActions sx={{ padding: "8px 16px", height: "52px" }}>
									{" "}
									{/* Fixed height for actions */}
									<Button
										size="small"
										color="primary"
										onClick={() => handleViewSet(set.id)}
									>
										Study
									</Button>
									<Box sx={{ flexGrow: 1 }} />
									<IconButton
										size="small"
										onClick={e => handleEditSet(set.id, e)}
									>
										{/* <EditIcon fontSize="small" /> */}
									</IconButton>
									<IconButton
										size="small"
										color="error"
										onClick={e => handleDeleteClick(set.id, e)}
									>
										<DeleteIcon fontSize="small" />
									</IconButton>
								</CardActions>
							</Card>
						</Box>
					))}
				</Grid>
			)}

			<Dialog
				open={deleteDialogOpen}
				onClose={() => setDeleteDialogOpen(false)}
			>
				<DialogTitle>Delete Flashcard Set</DialogTitle>
				<DialogContent>
					<DialogContentText>
						Are you sure you want to delete this flashcard set? This action
						cannot be undone.
					</DialogContentText>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
					<Button onClick={confirmDelete} color="error" autoFocus>
						Delete
					</Button>
				</DialogActions>
			</Dialog>

			{/* Notification Snackbar */}
			<Snackbar
				open={notification.open}
				autoHideDuration={6000}
				onClose={handleCloseNotification}
				anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
			>
				<Alert
					onClose={handleCloseNotification}
					severity={notification.type}
					sx={{ width: "100%" }}
				>
					{notification.message}
				</Alert>
			</Snackbar>
		</Container>
	)
}

export default Sets
