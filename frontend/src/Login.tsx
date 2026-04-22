import React, { useState, useEffect } from "react"
import {
	Box,
	Button,
	TextField,
	Typography,
	Paper,
	Link,
	Container,
	InputAdornment,
	IconButton,
	Alert,
	CircularProgress,
} from "@mui/material"
// import Grid from "@mui/material/Grid"
import {
	Visibility,
	VisibilityOff,
	Login as LoginIcon,
	PersonAdd as SignUpIcon,
	Google as GoogleIcon,
	GitHub as GitHubIcon,
} from "@mui/icons-material"
import { supabase } from "./supabaseClient"
import { useNavigate } from "react-router-dom"

function Login() {
	// Add the navigate hook
	const navigate = useNavigate()

	// State for user authentication
	// const [isLoggedIn, setIsLoggedIn] = useState(false)
	const [isCheckingAuth, setIsCheckingAuth] = useState(true)
	const [showLoginForm, setShowLoginForm] = useState(true)

	const [email, setEmail] = useState("")
	const [password, setPassword] = useState("")
	const [confirmPassword, setConfirmPassword] = useState("")
	const [showPassword, setShowPassword] = useState(false)
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState("")
	const [success, setSuccess] = useState("")

	// Check if user is already logged in
	useEffect(() => {
		async function checkAuth() {
			const { data } = await supabase.auth.getSession()
			if (data.session) {
				// setIsLoggedIn(true)
				// Redirect to sets page if already logged in
				navigate("/sets")
			} else {
				// setIsLoggedIn(false)
				// Default to sign up form for new users
				setShowLoginForm(false)
			}
			setIsCheckingAuth(false)
		}

		checkAuth()
	}, [navigate])

	const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setEmail(e.target.value)
		if (error) setError("")
	}

	const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setPassword(e.target.value)
		if (error) setError("")
	}

	const handleConfirmPasswordChange = (
		e: React.ChangeEvent<HTMLInputElement>
	) => {
		setConfirmPassword(e.target.value)
		if (error) setError("")
	}

	const handleTogglePasswordVisibility = () => {
		setShowPassword(!showPassword)
	}

	// Toggle between login and signup forms
	const toggleForm = () => {
		setShowLoginForm(!showLoginForm)
		setError("")
		setSuccess("")
	}

	// Handle login submission
	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault()

		// validation
		if (!email) {
			setError("Email is required")
			return
		}
		if (!password) {
			setError("Password is required")
			return
		}

		// Login with Supabase
		setIsLoading(true)
		setError("")

		try {
			const { data, error } = await supabase.auth.signInWithPassword({
				email,
				password,
			})

			if (error) {
				throw error
			}

			console.log("Logged in successfully:", data)
			// Navigate to the Sets page after successful login
			navigate("/sets")
		} catch (err) {
			console.error("Login error:", err)
			setError("Failed to sign in")
		} finally {
			setIsLoading(false)
		}
	}

	// Handle signup submission
	const handleSignUp = async (e: React.FormEvent) => {
		e.preventDefault()

		// Basic validation
		if (!email) {
			setError("Email is required")
			return
		}
		if (!password) {
			setError("Password is required")
			return
		}
		if (password !== confirmPassword) {
			setError("Passwords do not match")
			return
		}
		if (password.length < 6) {
			setError("Password must be at least 6 characters")
			return
		}

		// Sign up with Supabase
		setIsLoading(true)
		setError("")

		try {
			const { error } = await supabase.auth.signUp({
				email,
				password,
			})

			if (error) {
				throw error
			}

			setSuccess("Account created successfully! You can now sign in.")
			setTimeout(() => {
				setShowLoginForm(true)
				setSuccess("")
			}, 3000)

			// Clear form
			setEmail("")
			setPassword("")
			setConfirmPassword("")
		} catch (err) {
			console.error("...", err)
			if (err instanceof Error) setError(err.message)
			else setError("Failed to sign in with ...")
		} finally {
			setIsLoading(false)
		}
	}

	// OAuth handlers
	const handleGoogleSignIn = async () => {
		try {
			setIsLoading(true)
			const { error } = await supabase.auth.signInWithOAuth({
				provider: "google",
				options: {
					redirectTo: `${window.location.origin}/auth/callback`,
				},
			})

			if (error) throw error
		} catch (err) {
			console.error("...", err)
			if (err instanceof Error) setError(err.message)
			else setError("Failed to sign in with Google")
		} finally {
			setIsLoading(false)
		}
	}

	const handleGitHubSignIn = async () => {
		try {
			setIsLoading(true)
			const { error } = await supabase.auth.signInWithOAuth({
				provider: "github",
				options: {
					redirectTo: `${window.location.origin}/auth/callback`,
				},
			})

			if (error) throw error
		} catch (err) {
			console.error("...", err)
			if (err instanceof Error) setError(err.message)
			else setError("Failed to sign in with GitHub")
		} finally {
			setIsLoading(false)
		}
	}

	// Show loading while checking authentication
	if (isCheckingAuth) {
		return (
			<Container maxWidth="sm">
				<Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
					<CircularProgress />
				</Box>
			</Container>
		)
	}

	return (
		<Container maxWidth="sm">
			<Paper elevation={3} sx={{ mt: 8, p: { xs: 2, sm: 4 }, borderRadius: 2 }}>
				<Box
					sx={{
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
					}}
				>
					<Typography
						component="h1"
						variant="h4"
						gutterBottom
						sx={{ fontWeight: 600 }}
					>
						{showLoginForm ? "Sign In to Quizzy" : "Create Account"}
					</Typography>
					<Typography variant="body2" color="text.secondary" mb={3}>
						{showLoginForm
							? "Enter your credentials to access your account"
							: "Join Quizzy to create and study flashcards"}
					</Typography>

					{error && (
						<Alert severity="error" sx={{ width: "100%", mb: 2 }}>
							{error}
						</Alert>
					)}

					{success && (
						<Alert severity="success" sx={{ width: "100%", mb: 2 }}>
							{success}
						</Alert>
					)}

					<Box
						component="form"
						onSubmit={showLoginForm ? handleLogin : handleSignUp}
						sx={{ width: "100%" }}
					>
						<TextField
							margin="normal"
							required
							fullWidth
							id="email"
							label="Email Address"
							name="email"
							autoComplete="email"
							autoFocus
							value={email}
							onChange={handleEmailChange}
							sx={{ mb: 2 }}
						/>
						<TextField
							margin="normal"
							required
							fullWidth
							name="password"
							label="Password"
							id="password"
							autoComplete={showLoginForm ? "current-password" : "new-password"}
							type={showPassword ? "text" : "password"}
							value={password}
							onChange={handlePasswordChange}
							InputProps={{
								endAdornment: (
									<InputAdornment position="end">
										<IconButton
											aria-label="toggle password visibility"
											onClick={handleTogglePasswordVisibility}
											edge="end"
										>
											{showPassword ? <VisibilityOff /> : <Visibility />}
										</IconButton>
									</InputAdornment>
								),
							}}
							sx={{ mb: !showLoginForm ? 2 : 3 }}
						/>

						{/* Show confirm password field only for signup */}
						{!showLoginForm && (
							<TextField
								margin="normal"
								required
								fullWidth
								name="confirmPassword"
								label="Confirm Password"
								id="confirmPassword"
								autoComplete="new-password"
								type={showPassword ? "text" : "password"}
								value={confirmPassword}
								onChange={handleConfirmPasswordChange}
								sx={{ mb: 3 }}
							/>
						)}

						{/* Show forgot password link only for login */}
						{showLoginForm && (
							<Box sx={{ textAlign: "right", mb: 2 }}>
								<Link href="#" underline="hover" variant="body2">
									Forgot password?
								</Link>
							</Box>
						)}

						<Button
							type="submit"
							fullWidth
							variant="contained"
							size="large"
							disabled={isLoading}
							startIcon={
								isLoading ? null : showLoginForm ? (
									<LoginIcon />
								) : (
									<SignUpIcon />
								)
							}
							sx={{
								py: 1.5,
								mb: 3,
								position: "relative",
							}}
						>
							{isLoading ? (
								<CircularProgress size={24} sx={{ position: "absolute" }} />
							) : showLoginForm ? (
								"Sign In"
							) : (
								"Sign Up"
							)}
						</Button>

						{/* <Divider sx={{ my: 2 }}>
              <Typography variant="body2" color="text.secondary">
                OR
              </Typography>
            </Divider> */}

						<Box
							sx={{
								display: "flex",
								gap: 2,
								mb: 3,
								flexDirection: { xs: "column", sm: "row" },
							}}
						>
							<Button
								fullWidth
								variant="outlined"
								startIcon={<GoogleIcon />}
								sx={{ py: 1 }}
								onClick={handleGoogleSignIn}
								disabled={isLoading}
							>
								Google
							</Button>
							<Button
								fullWidth
								variant="outlined"
								startIcon={<GitHubIcon />}
								sx={{ py: 1 }}
								onClick={handleGitHubSignIn}
								disabled={isLoading}
							>
								GitHub
							</Button>
						</Box>

						<Box sx={{ textAlign: "center" }}>
							<Typography variant="body2">
								{showLoginForm
									? "Don't have an account? "
									: "Already have an account? "}
								<Link
									component="button"
									type="button"
									underline="hover"
									fontWeight="500"
									onClick={toggleForm}
								>
									{showLoginForm ? "Sign up" : "Sign in"}
								</Link>
							</Typography>
						</Box>
					</Box>
				</Box>
			</Paper>
		</Container>
	)
}

export default Login
