import { useState } from "react";
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
    <section className="panel">
      <h2>1. Localisation</h2>
      <form onSubmit={handleSearch} className="search-form">
        <input
          type="text"
          inputMode="numeric"
          placeholder="Code postal (ex: 38500)"
          value={postalCode}
          onChange={(e) => setPostalCode(e.target.value)}
          maxLength={5}
        />
        <button type="submit" disabled={loading || postalCode.length !== 5}>
          {loading ? "Recherche..." : "Rechercher"}
        </button>
      </form>
      {error && <p className="error">{error}</p>}
      {results.length > 1 && (
        <ul className="commune-list">
          {results.map((commune) => (
            <li key={commune.code}>
              <button
                type="button"
                className={
                  selected?.code === commune.code ? "selected" : undefined
                }
                onClick={() => onSelect(commune)}
              >
                {commune.nom}
                {commune.population
                  ? ` (${commune.population.toLocaleString("fr-FR")} hab.)`
                  : ""}
              </button>
            </li>
          ))}
        </ul>
      )}
      {selected && (
        <p className="selected-commune">
          📍 <strong>{selected.nom}</strong> ({selected.codePostal}) &mdash;
          lat {selected.latitude.toFixed(3)}, lon{" "}
          {selected.longitude.toFixed(3)}
        </p>
      )}
    </section>
  );
}
