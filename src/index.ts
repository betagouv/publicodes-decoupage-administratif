import _communes from "@etalab/decoupage-administratif/data/communes.json";
import _departements from "@etalab/decoupage-administratif/data/departements.json";
import _regions from "@etalab/decoupage-administratif/data/regions.json";
import _epci from "@etalab/decoupage-administratif/data/epci.json";
import { RuleName, Situation } from "../publicodes-build/";
import { ASTNode, reduceAST } from "publicodes";

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

export type Region = {
  code: string;
  chefLieu: string;
  nom: string;
  typeLiaison?: 0 | 1 | 2 | 3 | 4;
  zone: "metro" | "drom" | "com";
};

export type Departement = {
  code: string;
  region: Region["code"];
  chefLieu: string;
  nom: string;
  typeLiaison?: 0 | 1 | 2 | 3 | 4 | 5;
  zone: "metro" | "dom" | "com";
};

const communes = _communes as Commune[];
const epci = _epci as EPCI[];
const departements = _departements as Departement[];
const regions = _regions as Region[];

/** Associate each commune INSEE code to its EPCI SIREN code.
 *
 *  PERF: should we do this at build time?
 */
const epci_by_communes = Object.fromEntries(
  epci.flatMap((epci) => epci.membres.map(({ code }) => [code, epci]))
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
 *   "localisation . code commune": "'38185'",  // Grenoble
 *   "localisation . code epci": "'200040715'", // Grenoble-Alpes-Métropole
 *   "localisation . code département": "'38'", // Isère
 *   "localisation . code région": "'84'"       // Auvergne-Rhône-Alpes
 * }
 * ```
 */
export function getFullSituationFromCommune(
  code: string
): Omit<Situation, "localisation"> | undefined {
  const commune = communes.find((c) => c.code === code);
  if (commune) {
    return {
      "commune . code": fmt(code),
      "epci . code": fmt(epci_by_communes[code].code),
      "epci . nom": fmt(epci_by_communes[code].nom),
      "département . code": fmt(commune?.departement),
      "région . code": fmt(commune?.region),
    };
  }
}

function fmt(v: string | undefined): `'${string}'` {
  return `'${v ?? ""}'`;
}

export type Localisation = {
  type: "région" | "département" | "epci" | "commune";
  valeur: string;
  code: string;
  nom: string;
};

const LOCALISATION_KINDS: RuleName[] = [
  "commune . code",
  "région . code",
  "département . code",
  "epci . code",
  "epci . nom",
];

export function extractLocalisationFromAST(
  rule: ASTNode,
  namespace?: string
): Localisation[] {
  const toKind = (dottedName: string): Localisation["type"] | undefined => {
    if (dottedName.endsWith("commune . code")) {
      return "commune";
    }
    if (dottedName.endsWith("région . code")) {
      return "région";
    }
    if (dottedName.endsWith("département . code")) {
      return "département";
    }
    if (
      dottedName.endsWith("epci . code") ||
      dottedName.endsWith("epci . nom")
    ) {
      return "epci";
    }
  };
  const _namespace = namespace ? `${namespace} .` : "";
  const extract = (
    ref: ASTNode<"reference">,
    value: ASTNode<"constant">
  ): Localisation | undefined => {
    // TODO: should we throw an error if the value is not a string?
    if (value.type !== "string") {
      return;
    }
    for (let kind of LOCALISATION_KINDS) {
      if (ref.dottedName === `${_namespace} ${kind}`) {
        const valeur = value.nodeValue?.toString();
        const infos = getInfosFor(kind, valeur);

        if (valeur && infos) {
          return {
            type: toKind(ref.dottedName)!,
            valeur,
            nom: infos.nom,
            code: infos.code,
          };
        }
      }
    }
  };

  return reduceAST(
    (acc, node) => {
      if (node.nodeKind === "operation" && node.operationKind === "=") {
        const ref =
          node.explanation[0]?.nodeKind === "reference"
            ? node.explanation[0]
            : node.explanation[1].nodeKind === "reference"
            ? node.explanation[1]
            : undefined;
        const value =
          node.explanation[0]?.nodeKind === "constant"
            ? node.explanation[0]
            : node.explanation[1].nodeKind === "constant"
            ? node.explanation[1]
            : undefined;
        if (ref && value) {
          const localisation = extract(ref, value);
          if (
            localisation &&
            !acc.find(
              (l: Localisation) =>
                l.type === localisation.type && l.valeur === localisation.valeur
            )
          ) {
            acc.push(localisation);
          }
          return acc;
        }
      }
    },
    new Array<Localisation>(),
    rule
  );
  //
  // if (localisations.length === 0) {
  //   console.warn(`No localisation found for ${rule.dottedName}`);
  //   return;
  // }

  // const normalizedLocalisations = localisations.map((loc) => {
  //   // In our rule basis we reference EPCI by their name but for iteroperability
  //   // with third-party systems it is more robust to expose their SIREN code.
  //   if (loc.kind === "epci") {
  //     const code = epci.find(({ nom }) => nom === loc.value)?.code;
  //
  //     if (!code) {
  //       console.error(`Bad EPCI code: ${loc.value}`);
  //       exit(1);
  //     }
  //
  //     return { ...loc, code };
  //   }
  //
  //   return loc;
  // });

  // FIXME: should handle multiple localisations
  // return normalizedLocalisations[0];
}

function getInfosFor(
  kind: RuleName,
  value: string | undefined
): Pick<Localisation, "code" | "nom"> | undefined {
  if (!value) {
    return;
  }
  switch (kind) {
    case "commune . code": {
      return communes.find((c) => c.code === value);
    }
    case "epci . nom": {
      return epci.find((c) => c.nom === value);
    }
    case "epci . code": {
      return epci.find((c) => c.code === value);
    }

    case "région . code": {
      return regions.find((r) => r.code === value);
    }

    case "département . code": {
      return departements.find((d) => d.code === value);
    }
  }
}
