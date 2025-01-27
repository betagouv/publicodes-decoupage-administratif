import _communes from "@etalab/decoupage-administratif/data/communes.json";
import _epci from "@etalab/decoupage-administratif/data/epci.json";
import { Situation } from "../publicodes-build/";

/**
 * NOTE: this type has been inferred from the
 * @etalab/decoupage-administratif/data/communes.json file  by running 'fx
 * @.<key> uniq sort' on the data. Therefore, there is no guarantee that in
 * future versions of the data, the keys will remain the same.
 */
export type Commune = {
  /** The INSEE code of the commune (e.g. "75056"). */
  code: string;
  nom: string;
  typeLiaison?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8;
  zone: "metro" | "dom" | "com";
  arrondissement?: string;
  departement: string;
  region: string;
  type:
    | "commune-actuelle"
    | "commune-deleguee"
    | "commune-associee"
    | "arrondissement-municipal";
  rangChefLieu?: 0;
  siren?: string;
  codesPostaux?: string[];
  population?: number;
};

/**
 * NOTE: this type has been inferred from the
 * @etalab/decoupage-administratif/data/epci.json file  by running 'fx @.<key>
 * uniq sort' on the data. Therefore, there is no guarantee that in future
 * versions of the data, the keys will remain the same.
 */
export type EPCI = {
  /** The SIREN code of the EPCI (e.g. "200000172"). */
  code: string;
  /** The name of the EPCI (e.g. "CC Faucigny - Glières"). */
  nom: string;
  /** The type of the EPCI (i.e. "Communauté d'agglomération", "Communauté de communes", ...). */
  type: "CA" | "CC" | "CU" | "MET69" | "METRO";
  modeFinancement: "FA" | "FPU";
  populationTotale: number;
  populationMunicipale: number;
  membres: Array<
    Pick<Commune, "code" | "siren" | "nom"> & {
      populationTotale: number;
      populationMunicipale: number;
    }
  >;
};

const communes = _communes as Commune[];
const epci = _epci as EPCI[];

/** Associate each commune INSEE code to its EPCI SIREN code.
 *
 *  PERF: should we do this at build time?
 */
const epci_by_communes = Object.fromEntries(
  epci.flatMap((epci) => epci.membres.map(({ code }) => [code, epci.code])),
);

/**
 * Returns the completed situation object corresponding to the given INSEE code.
 *
 * @param code - The INSEE code of the commune.
 * @returns The completed situation object corresponding to the given INSEE code. If the code is not valid (i.e. not corresponding to any commune), returns `undefined`.
 *
 * @example
 * ```typescript
 * console.log(getSituationFromCodeINSEE("38185"));
 * // Output:
 * {
 *   "localisation . code insee": "'38185'",    // Grenoble
 *   "localisation . code epci": "'200040715'", // Grenoble-Alpes-Métropole
 *   "localisation . code département": "'38'", // Isère
 *   "localisation . code région": "'84'"       // Auvergne-Rhône-Alpes
 * }
 * ```
 */
export function getSituationFromCodeINSEE(
  code: string,
): Omit<Situation, "localisation"> | undefined {
  const commune = communes.find((c) => c.code === code);
  if (commune) {
    return {
      "localisation . code insee": fmt(code),
      "localisation . code epci": fmt(epci_by_communes[code]),
      "localisation . code département": fmt(commune?.departement),
      "localisation . code région": fmt(commune?.region),
    };
  }
}

function fmt(v: string | undefined): `'${string}'` {
  return `'${v ?? ""}'`;
}
