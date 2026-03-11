import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Pomocné objekty pro určení souřadnic
// Uživatel si může vybrat, zda zaměřuje překážku zleva nebo zprava
const PositionX = v.union(
  v.object({ measuredFrom: v.literal("left"), distance: v.number() }), // Měřeno od levého okraje
  v.object({ measuredFrom: v.literal("right"), distance: v.number() }), // Měřeno od pravého okraje
);

// To samé pro vertikální osu (shora / zdola)
const PositionY = v.union(
  v.object({ measuredFrom: v.literal("top"), distance: v.number() }), // Měřeno od hřebene (shora)
  v.object({ measuredFrom: v.literal("bottom"), distance: v.number() }), // Měřeno od okapu (zdola)
);

export default defineSchema({
  roofs: defineTable({
    // 1. ZÁKLADNÍ ÚDAJE O STŘEŠE
    name: v.string(), // Jméno zákazníka (např. pro zobrazení v seznamu projektů)
    roofWidth: v.number(), // Celková šířka střechy (např. v cm)
    roofHeight: v.number(), // Celková výška střechy od okapu po hřeben (v cm)

    // 2. PŘEKÁŽKY NA STŘEŠE (Problémové body)
    // Pole může být na začátku prázdné [] a postupně se do něj přidávají objekty
    obstacles: v.array(
      v.union(
        // TYP 1: Střešní okno (Vyžaduje zadat šířku i výšku)
        v.object({
          type: v.literal("roof_window"),
          positionX: PositionX,
          positionY: PositionY,
          width: v.number(), // Šířka samotného okna
          height: v.number(), // Výška samotného okna
          clearanceZone: v.number(), // Ochranné pásmo (kolik cm kolem okna nesmí být panel)
          note: v.optional(v.string()), // Volitelná poznámka pro montéry
        }),

        // TYP 2: Komín (Často se zadává jen jako jeden rozměr základny)
        v.object({
          type: v.literal("chimney"),
          positionX: PositionX,
          positionY: PositionY,
          size: v.number(), // Šířka hrany komínu
          clearanceZone: v.number(), // Ochranné pásmo (u komínů bývá často větší kvůli stínění)
          note: v.optional(v.string()),
        }),

        // TYP 3: Hromosvod / Tyčová překážka (Nemá reálnou šířku/výšku, je to jen bod)
        v.object({
          type: v.literal("lightning_rod"),
          positionX: PositionX,
          positionY: PositionY,
          clearanceZone: v.number(), // Bezpečná vzdálenost od svodu (např. 50 cm)
          note: v.optional(v.string()),
        }),
      ),
    ),
  }),
});
