import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  roofs: defineTable({
    name: v.string(),
    roofWidth: v.number(),
    roofHeight: v.number(),

    // NOVÉ: Sloupečky pro uložení solárních panelů a jejich pozice
    panelConfig: v.optional(v.any()),
    panelLayout: v.optional(v.any()),
    savedPosition: v.optional(
      v.object({
        x: v.number(),
        y: v.number(),
      }),
    ),

    obstacles: v.array(
      v.union(
        // TYP 1: Střešní okno
        v.object({
          type: v.literal("roof_window"),
          positionX: v.union(
            v.object({ measuredFrom: v.literal("left"), distance: v.number() }),
            v.object({
              measuredFrom: v.literal("right"),
              distance: v.number(),
            }),
          ),
          positionY: v.union(
            v.object({ measuredFrom: v.literal("top"), distance: v.number() }),
            v.object({
              measuredFrom: v.literal("bottom"),
              distance: v.number(),
            }),
          ),
          width: v.number(),
          height: v.number(),
          clearanceZone: v.number(),
          note: v.optional(v.string()),
        }),

        // TYP 2: Komín
        v.object({
          type: v.literal("chimney"),
          positionX: v.union(
            v.object({ measuredFrom: v.literal("left"), distance: v.number() }),
            v.object({
              measuredFrom: v.literal("right"),
              distance: v.number(),
            }),
          ),
          positionY: v.union(
            v.object({ measuredFrom: v.literal("top"), distance: v.number() }),
            v.object({
              measuredFrom: v.literal("bottom"),
              distance: v.number(),
            }),
          ),
          size: v.number(),
          clearanceZone: v.number(),
          note: v.optional(v.string()),
        }),

        // TYP 3: Hromosvod
        v.object({
          type: v.literal("lightning_rod"),
          positionX: v.union(
            v.object({ measuredFrom: v.literal("left"), distance: v.number() }),
            v.object({
              measuredFrom: v.literal("right"),
              distance: v.number(),
            }),
          ),
          positionY: v.union(
            v.object({ measuredFrom: v.literal("top"), distance: v.number() }),
            v.object({
              measuredFrom: v.literal("bottom"),
              distance: v.number(),
            }),
          ),
          clearanceZone: v.number(),
          note: v.optional(v.string()),
        }),
      ),
    ),
  }),
});
