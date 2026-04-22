import { supabase } from "./supabaseClient"

// force sign out to home page
export const signOutAndRedirect = async (): Promise<void> => {
	try {
		await supabase.auth.signOut()
		window.location.href = "/"
	} catch (error) {
		console.error("Error signing out:", error)
		window.location.href = "/"
	}
}
