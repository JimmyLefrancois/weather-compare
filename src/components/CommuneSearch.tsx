import { useState } from "react";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import ListItemIcon from "@mui/material/ListItemIcon";
import Alert from "@mui/material/Alert";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import SearchIcon from "@mui/icons-material/Search";
import PlaceIcon from "@mui/icons-material/Place";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import type { Commune } from "../types";
import { searchCommunesByPostalCode } from "../api/geocoding";

interface CommuneSearchProps {
  onSelect: (commune: Commune) => void;
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
      setResults(communes);
      if (communes.length === 1) {
        onSelect(communes[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue.");
    } finally {
      setLoading(false);
    }
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

      {results.length > 1 && (
        <List disablePadding sx={{ bgcolor: "action.hover", borderRadius: 2 }}>
          {results.map((commune) => (
            <ListItemButton
              key={commune.code}
              selected={selected?.code === commune.code}
              onClick={() => onSelect(commune)}
            >
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
      )}

      {selected && (
        <Chip
          icon={<CheckCircleIcon />}
          color="success"
          variant="outlined"
          label={`${selected.nom} (${selected.codePostal})`}
          sx={{ alignSelf: "flex-start" }}
        />
      )}
    </Stack>
  );
}
