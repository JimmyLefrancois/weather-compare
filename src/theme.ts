import { createTheme } from "@mui/material/styles";
import { frFR as coreFrFR } from "@mui/material/locale";

/**
 * Material Design theme for Weather Compare. Mobile is the primary target:
 * comfortable touch targets, slightly larger default spacing, and a
 * weather-inspired blue/teal palette with clear semantic colors for
 * rainfall deficit (error), normal (info) and surplus (success).
 */
export const theme = createTheme(
  {
    palette: {
      mode: "light",
      primary: { main: "#1565c0" },
      secondary: { main: "#00897b" },
      background: { default: "#f3f6fa" },
    },
    shape: { borderRadius: 14 },
    typography: {
      fontFamily: '"Roboto", "Segoe UI", system-ui, -apple-system, sans-serif',
      h1: { fontSize: "1.5rem", fontWeight: 600 },
      h6: { fontWeight: 600 },
    },
    components: {
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: { textTransform: "none", borderRadius: 10 },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { fontWeight: 500 },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: { borderRadius: 14 },
        },
      },
      MuiAccordion: {
        styleOverrides: {
          root: {
            "&:before": { display: "none" },
          },
        },
      },
    },
  },
  coreFrFR,
);
