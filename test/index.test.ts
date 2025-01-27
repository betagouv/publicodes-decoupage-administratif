import { test, expect, describe } from "vitest";
import {
  extractLocalisationFromAST,
  getFullSituationFromCommune,
} from "../src";
import { getModelFromSource } from "@publicodes/tools/compilation";
import Engine from "publicodes";

describe("getFullSituationFromCommune", () => {
  test("'75056'", () => {
    expect(getFullSituationFromCommune("75056")).toEqual({
      "commune . code": "'75056'", // Paris
      "epci . code": "'200054781'", // Métropole du Grand Paris
      "epci . nom": "'Métropole du Grand Paris'",
      "département . code": "'75'", // Paris
      "région . code": "'11'", // Île-de-France
    });
  });

  test("'38185'", () => {
    expect(getFullSituationFromCommune("38185")).toEqual({
      "commune . code": "'38185'", // Grenoble
      "epci . code": "'200040715'", // Grenoble-Alpes-Métropole
      "epci . nom": "'Grenoble-Alpes-Métropole'",
      "département . code": "'38'", // Isère
      "région . code": "'84'", // Auvergne-Rhône-Alpes
    });
  });

  test("''", () => {
    expect(getFullSituationFromCommune("")).toBeUndefined();
  });

  test("'1034134'", () => {
    expect(getFullSituationFromCommune("")).toBeUndefined();
  });
});

describe("extractLocalisationFromAST", () => {
  const testRules = getModelFromSource("test/data/extract.publicodes");
  const testEngine = new Engine(testRules);

  test("simple commune code", () => {
    expect(
      extractLocalisationFromAST(
        testEngine.getRule("simple commune code"),
        "localisation"
      )
    ).toEqual([
      {
        type: "commune",
        code: "75101",
        nom: "Paris 1er Arrondissement",
        valeur: "75101",
      },
    ]);
  });

  test("simple commune code (inversed comparison)", () => {
    expect(
      extractLocalisationFromAST(
        testEngine.getRule("simple commune code . inversed comparison"),
        "localisation"
      )
    ).toEqual([
      {
        type: "commune",
        code: "75101",
        nom: "Paris 1er Arrondissement",
        valeur: "75101",
      },
    ]);
  });

  test("simple epci name", () => {
    expect(
      extractLocalisationFromAST(
        testEngine.getRule("simple epci name"),
        "localisation"
      )
    ).toEqual([
      {
        type: "epci",
        code: "243300316",
        nom: "Bordeaux Métropole",
        valeur: "Bordeaux Métropole",
      },
    ]);
  });

  test("multiple localisations", () => {
    expect(
      extractLocalisationFromAST(
        testEngine.getRule("multiple localisations"),
        "localisation"
      )
    ).toEqual([
      {
        type: "epci",
        code: "243300316",
        nom: "Bordeaux Métropole",
        valeur: "Bordeaux Métropole",
      },
      {
        type: "commune",
        code: "75101",
        nom: "Paris 1er Arrondissement",
        valeur: "75101",
      },
    ]);
  });

  test("multiple localisations complex", () => {
    expect(
      extractLocalisationFromAST(
        testEngine.getRule("multiple localisations . complex"),
        "localisation"
      )
    ).toEqual([
      {
        type: "epci",
        code: "243300316",
        nom: "Bordeaux Métropole",
        valeur: "Bordeaux Métropole",
      },
      {
        type: "commune",
        code: "75101",
        nom: "Paris 1er Arrondissement",
        valeur: "75101",
      },
      {
        type: "département",
        code: "75",
        nom: "Paris",
        valeur: "75",
      },
    ]);
  });

  test("simplified reference name", () => {
    expect(
      extractLocalisationFromAST(
        testEngine.getRule("localisation . simplified"),
        "localisation"
      )
    ).toEqual([{ type: "région", code: "06", nom: "Mayotte", valeur: "06" }]);
  });
});
