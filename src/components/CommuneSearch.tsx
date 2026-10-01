import { useState } from "react";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import ListItemIcon from "@mui/material/ListItemIcon";
import Alert from "@mui/material/Alert";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import SearchIcon from "@mui/icons-material/Search";
import PlaceIcon from "@mui/icons-material/Place";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import EditIcon from "@mui/icons-material/Edit";
import type { Commune } from "../types";
import { searchCommunesByPostalCode } from "../api/geocoding";

interface CommuneSearchProps {
  onSelect: (commune: Commune | null) => void;
  selected: Commune | null;
}

export function CommuneSearch({ onSelect, selected }: CommuneSearchProps) {
  const [postalCode, setPostalCode] = useState("");
  const [results, setResults] = useState<Commune[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResults([]);
    try {
      const communes = await searchCommunesByPostalCode(postalCode);
      if (communes.length === 1) {
        // Only one commune for this postal code: no need to ask, select it directly.
        onSelect(communes[0]);
      } else {
        // Several communes share this postal code: let the user pick one in a popup.
        setResults(communes);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue.");
    } finally {
      setLoading(false);
    }
  }

  function handlePick(commune: Commune) {
    onSelect(commune);
    setResults([]); // closes the popup
  }

  function handleReset() {
    onSelect(null);
    setPostalCode("");
  }

  // Once a commune is chosen, the search form is hidden so only a single
  // locality can ever be selected at a time; the user must explicitly tap
  // "Modifier" to search again, which clears the current selection first.
  if (selected) {
    return (
      <Paper
        variant="outlined"
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          p: 1.25,
        }}
      >
        <CheckCircleIcon color="success" />
        <Stack spacing={0} sx={{ flexGrow: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {selected.nom}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {selected.codePostal}
          </Typography>
        </Stack>
        <IconButton aria-label="Modifier la commune" onClick={handleReset} size="small">
          <EditIcon fontSize="small" />
        </IconButton>
      </Paper>
    );
  }

  return (
    <Stack spacing={2}>
      <Stack
        component="form"
        onSubmit={handleSearch}
        direction="row"
        spacing={1}
      >
        <TextField
          label="Code postal"
          placeholder="ex: 38500"
          value={postalCode}
          onChange={(e) => setPostalCode(e.target.value)}
          slotProps={{ htmlInput: { inputMode: "numeric", maxLength: 5 } }}
          size="small"
          fullWidth
        />
        <Button
          type="submit"
          variant="contained"
          disabled={loading || postalCode.length !== 5}
          startIcon={
            loading ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              <SearchIcon />
            )
          }
          sx={{ flexShrink: 0 }}
        >
          Chercher
        </Button>
      </Stack>

      {error && <Alert severity="error">{error}</Alert>}

      <Dialog open={results.length > 1} onClose={() => setResults([])} fullWidth maxWidth="xs">
        <DialogTitle>Plusieurs communes trouvées</DialogTitle>
        <DialogContent sx={{ px: 1, pb: 2 }}>
          <List disablePadding>
            {results.map((commune) => (
              <ListItemButton key={commune.code} onClick={() => handlePick(commune)}>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <PlaceIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary={commune.nom}
                  secondary={
                    commune.population
                      ? `${commune.population.toLocaleString("fr-FR")} habitants`
                      : undefined
                  }
                />
              </ListItemButton>
            ))}
          </List>
        </DialogContent>
      </Dialog>
    </Stack>
  );
}
