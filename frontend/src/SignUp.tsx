import React, { useState } from "react"
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
import {
	Visibility,
	VisibilityOff,
	PersonAdd as SignUpIcon,
	Google as GoogleIcon,
	GitHub as GitHubIcon,
} from "@mui/icons-material"
import { supabase } from "./supabaseClient"

function SignUp() {
	// const theme = useTheme()
	const [email, setEmail] = useState("")
	const [password, setPassword] = useState("")
	const [confirmPassword, setConfirmPassword] = useState("")
	const [showPassword, setShowPassword] = useState(false)
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState("")
	const [success, setSuccess] = useState("")

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

	const handleSubmit = async (e: React.FormEvent) => {
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
		setSuccess("")

		try {
			const { data, error } = await supabase.auth.signUp({
				email,
				password,
			})

			if (error) {
				throw error
			}

			console.log("Signed up successfully:", data)
			setSuccess(
				"Account created successfully! Please check your email for verification."
			)
			// Clear form fields after successful signup
			setEmail("")
			setPassword("")
			setConfirmPassword("")
		} catch (err) {
			console.error("...", err)
			if (err instanceof Error) setError(err.message)
			else setError("Failed to create account")
		} finally {
			setIsLoading(false)
		}
	}

	const handleGoogleSignUp = async () => {
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
			else setError("Failed to sign up with Google")
		} finally {
			setIsLoading(false)
		}
	}

	const handleGitHubSignUp = async () => {
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
						Create Account
					</Typography>
					<Typography variant="body2" color="text.secondary" mb={3}>
						Join Quizzy to create and study flashcards
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

					<Box component="form" onSubmit={handleSubmit} sx={{ width: "100%" }}>
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
							autoComplete="new-password"
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
							sx={{ mb: 2 }}
						/>
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

						<Button
							type="submit"
							fullWidth
							variant="contained"
							size="large"
							disabled={isLoading}
							startIcon={isLoading ? null : <SignUpIcon />}
							sx={{
								py: 1.5,
								mb: 3,
								position: "relative",
							}}
						>
							{isLoading ? (
								<CircularProgress size={24} sx={{ position: "absolute" }} />
							) : (
								"Sign Up"
							)}
						</Button>

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
								onClick={handleGoogleSignUp}
								disabled={isLoading}
							>
								Google
							</Button>
							<Button
								fullWidth
								variant="outlined"
								startIcon={<GitHubIcon />}
								sx={{ py: 1 }}
								onClick={handleGitHubSignUp}
								disabled={isLoading}
							>
								GitHub
							</Button>
						</Box>

						<Box sx={{ textAlign: "center" }}>
							<Typography variant="body2">
								Already have an account?{" "}
								<Link href="/login" underline="hover" fontWeight="500">
									Sign in
								</Link>
							</Typography>
						</Box>
					</Box>
				</Box>
			</Paper>
		</Container>
	)
}

export default SignUp
