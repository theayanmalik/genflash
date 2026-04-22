import { createTheme, responsiveFontSizes } from "@mui/material/styles"

// 🎨 Modern clean palette
const colors = {
  primary: "#7c3aed",       // purple
  secondary: "#0ea5e9",     // blue
  background: "#f8fafc",    // soft white
  surface: "#ffffff",
  textPrimary: "#0f172a",   // dark navy
  textSecondary: "#475569",
}

let theme = createTheme({
  palette: {
    primary: {
      main: colors.primary,
      contrastText: "#ffffff",
    },
    secondary: {
      main: colors.secondary,
      contrastText: "#ffffff",
    },
    background: {
      default: colors.background,
      paper: colors.surface,
    },
    text: {
      primary: colors.textPrimary,
      secondary: colors.textSecondary,
    },
    error: {
      main: "#ef4444",
    },
  },

  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: { color: colors.textPrimary },
    h2: { color: colors.textPrimary },
    h3: { color: colors.textPrimary },
    h4: { color: colors.textSecondary },
    h5: { color: colors.textSecondary },
    h6: { color: colors.textSecondary },
  },

  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: "none",
          fontWeight: 500,
        },
        contained: {
          boxShadow: "none",
          "&:hover": {
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          },
        },
        outlined: {
          borderColor: colors.primary,
          color: colors.primary,
          "&:hover": {
            borderColor: colors.primary,
            backgroundColor: `${colors.primary}10`,
          },
        },
      },
    },

    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: colors.surface,
          borderRadius: 8,
        },
      },
    },

    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: colors.surface,
        },
      },
    },

    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: "#ffffff",
          color: colors.textPrimary,
        },
      },
    },

    MuiDivider: {
      styleOverrides: {
        root: {
          backgroundColor: `${colors.textSecondary}20`,
        },
      },
    },

    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            "&:hover fieldset": {
              borderColor: colors.primary,
            },
            "&.Mui-focused fieldset": {
              borderColor: colors.primary,
            },
          },
        },
      },
    },
  },
})

// 📱 Responsive fonts
theme = responsiveFontSizes(theme)

export default theme