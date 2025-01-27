import { test, expect } from "vitest";
import { getSituationFromCodeINSEE } from "../src/";

test("getSituationFromCodeINSEE('75056')", () => {
  expect(getSituationFromCodeINSEE("75056")).toEqual({
    "localisation . code insee": "'75056'", // Paris
    "localisation . code epci": "'200054781'", // Métropole du Grand Paris
    "localisation . code département": "'75'", // Paris
    "localisation . code région": "'11'", // Île-de-France
  });
});

test("getSituationFromCodeINSEE('38185')", () => {
  expect(getSituationFromCodeINSEE("38185")).toEqual({
    "localisation . code insee": "'38185'", // Grenoble
    "localisation . code epci": "'200040715'", // Grenoble-Alpes-Métropole
    "localisation . code département": "'38'", // Isère
    "localisation . code région": "'84'", // Auvergne-Rhône-Alpes
  });
});

test("getSituationFromCodeINSEE('')", () => {
  expect(getSituationFromCodeINSEE("")).toBeUndefined();
});

test("getSituationFromCodeINSEE('1034134')", () => {
  expect(getSituationFromCodeINSEE("")).toBeUndefined();
});
