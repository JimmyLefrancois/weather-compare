import type { Commune } from "../types";

/**
 * Looks up French communes matching a postal code using the free, keyless
 * geo.api.gouv.fr API. A postal code can map to several communes (e.g. a
 * postal code shared by a small village and a larger neighbouring town).
 */
export async function searchCommunesByPostalCode(
  postalCode: string,
): Promise<Commune[]> {
  const trimmed = postalCode.trim();
  if (!/^\d{5}$/.test(trimmed)) {
    throw new Error("Le code postal doit contenir 5 chiffres.");
  }

  const url = new URL("https://geo.api.gouv.fr/communes");
  url.searchParams.set("codePostal", trimmed);
  url.searchParams.set("fields", "nom,code,centre,codesPostaux,population");
  url.searchParams.set("format", "json");

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(
      `Impossible de rechercher le code postal (erreur ${response.status}).`,
    );
  }

  const data: Array<{
    nom: string;
    code: string;
    centre: { coordinates: [number, number] };
    codesPostaux: string[];
    population?: number;
  }> = await response.json();

  if (!data.length) {
    throw new Error("Aucune commune trouvée pour ce code postal.");
  }

  return data.map((commune) => ({
    code: commune.code,
    nom: commune.nom,
    codePostal: trimmed,
    longitude: commune.centre.coordinates[0],
    latitude: commune.centre.coordinates[1],
    population: commune.population,
  }));
}
