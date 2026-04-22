import "./App.css"
import {
	BrowserRouter as Router,
	Routes,
	Route,
	Navigate,
	Link,
	useLocation,
} from "react-router-dom"
import {
	ThemeProvider,
	CssBaseline,
	AppBar,
	Toolbar,
	Box,
	Button,
	Typography,
	Container,
	useTheme,
} from "@mui/material"
import theme from "./theme"
import Login from "./Login"
import SignUp from "./SignUp"
import Upload from "./Upload"
import Home from "./Home"
import Sets from "./Sets"
import Flashcards from "./Flashcards"
// import EditFlashcards from "../frontend/EditFlashcards"
import { useState, useEffect } from "react"
import { supabase } from "./supabaseClient"
import QuizzyLogo from "./Quizzy.png"
import { signOutAndRedirect } from "./auth"

const Navigation = () => {
	const theme = useTheme()
	const location = useLocation()
	const [user, setUser] = useState<any>(null)

	useEffect(() => {
		const checkUser = async () => {
			const {
				data: { session },
			} = await supabase.auth.getSession()
			setUser(session?.user || null)
		}

		checkUser()

		const { data: authListener } = supabase.auth.onAuthStateChange(
			(_, session) => {
				setUser(session?.user || null)
			}
		)

		return () => {
			authListener?.subscription.unsubscribe()
		}
	}, [])

	const handleSignOut = async () => {
		await signOutAndRedirect()
	}

	if (location.pathname === "/login" || location.pathname === "/signup") {
		return null
	}

	return (
		<AppBar
			position="static"
			color="transparent"
			elevation={0}
			sx={{
				backgroundColor: theme.palette.background.default,
				borderBottom: `1px solid ${theme.palette.divider}`,
			}}
		>
			<Container maxWidth="lg">
				<Toolbar sx={{ flexWrap: "wrap", justifyContent: "space-between" }}>
					<Box sx={{ display: "flex", alignItems: "center" }}>
						<Box
							component="img"
							src={QuizzyLogo}
							alt="Quizzy Logo"
							sx={{
								height: 44,
								width: 44,
								mr: 1,
							}}
						/>
						<Typography
							variant="h5"
							color="inherit"
							noWrap
							sx={{ flexGrow: 1 }}
						>
							<Link to="/" style={{ textDecoration: "none", color: "inherit" }}>
								Quizzy
							</Link>
						</Typography>
					</Box>

					<Box sx={{ display: "flex", gap: 2 }}>
						{user ? (
							<>
								<Button
									component={Link}
									to="/sets"
									color="inherit"
									sx={{
										textTransform: "none",
										"&.active": { color: theme.palette.primary.main },
									}}
								>
									My Sets
								</Button>
								<Button
									component={Link}
									to="/upload"
									color="inherit"
									sx={{
										textTransform: "none",
										"&.active": { color: theme.palette.primary.main },
									}}
								>
									Create Set
								</Button>
								<Button
									color="primary"
									onClick={handleSignOut}
									variant="outlined"
									size="small"
									sx={{ ml: 1 }}
								>
									Sign Out
								</Button>
							</>
						) : (
							<>
								<Button
									component={Link}
									to="/login"
									color="primary"
									variant="outlined"
									sx={{ textTransform: "none" }}
								>
									Login
								</Button>
								<Button
									component={Link}
									to="/signup"
									color="primary"
									variant="contained"
									sx={{ textTransform: "none" }}
								>
									Sign Up
								</Button>
							</>
						)}
					</Box>
				</Toolbar>
			</Container>
		</AppBar>
	)
}

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
	const [authenticated, setAuthenticated] = useState(false)
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		async function checkAuth() {
			const {
				data: { session },
			} = await supabase.auth.getSession()
			setAuthenticated(!!session)
			setLoading(false)
		}

		checkAuth()
	}, [])

	if (loading) return null

	return authenticated ? <>{children}</> : <Navigate to="/login" />
}

function App() {
	return (
		<ThemeProvider theme={theme}>
			<CssBaseline />
			<Router>
				<Navigation />
				<Box sx={{ pt: 2, pb: 6 }}>
					<Routes>
						<Route path="/" element={<Home />} />
						<Route path="/home" element={<Home />} />
						<Route path="/login" element={<Login />} />
						<Route path="/signup" element={<SignUp />} />

						{/* Protected routes */}
						<Route
							path="/sets"
							element={
								<ProtectedRoute>
									<Sets />
								</ProtectedRoute>
							}
						/>
						<Route
							path="/upload"
							element={
								<ProtectedRoute>
									<Upload />
								</ProtectedRoute>
							}
						/>
						<Route
							path="/flashcards/:id"
							element={
								<ProtectedRoute>
									<Flashcards />
								</ProtectedRoute>
							}
						/>

						<Route path="*" element={<Navigate to="/" />} />
					</Routes>
				</Box>
			</Router>
		</ThemeProvider>
	)
}

export default App
