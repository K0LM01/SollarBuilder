import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

//GET ALL
export const getSolars = query({
  handler: async (ctx) => {
    const solars = await ctx.db.query("roofs").order("desc").collect();
    return solars;
  },
});

//INSERT nove strechy
export const addRoof = mutation({
  args: {
    name: v.string(),
    roofWidth: v.number(),
    roofHeight: v.number(),
  },
  handler: async (ctx, args) => {
    //nova strecha bez problemovych bodu
    return await ctx.db.insert("roofs", {
      name: args.name,
      roofWidth: args.roofWidth,
      roofHeight: args.roofHeight,
      obstacles: [],
    });
  },
});

//INSERT problemove body
export const addObstacle = mutation({
  args: {
    //upravovana strecha
    roofId: v.id("roofs"),

    //prebirani v frontendu
    newObstacle: v.any(),
  },
  //vytahnuti puvodni strechy
  handler: async (ctx, args) => {
    const existingRoof = await ctx.db.get(args.roofId);

    if (!existingRoof) {
      throw new Error("Střecha nebyla nalezena!");
    }

    //pridani noveho aktualniho bodu
    const updateObstacles = [...existingRoof.obstacles, args.newObstacle];

    //prepsani stare strechy novymi daty
    await ctx.db.patch(args.roofId, {
      obstacles: updateObstacles,
    });
  },
});

//UPDATE problemoveho bodu
export const updateObstacle = mutation({
  args: {
    roofId: v.id("roofs"), // Kterou střechu upravujeme
    obstacleIndex: v.number(), // Kolikátý bod v poli to je (0, 1, 2...)
    updatedObstacle: v.any(), // Nová data pro tento bod (např. posunuté souřadnice)
  },
  handler: async (ctx, args) => {
    // 1. Získáme aktuální stav střechy
    const roof = await ctx.db.get(args.roofId);
    if (!roof) throw new Error("Střecha nenalezena");

    // 2. Vytvoříme si kopii stávajícího pole překážek
    const newObstacles = [...roof.obstacles];

    // 3. Zkontrolujeme, zda index existuje (bezpečnostní pojistka)
    if (args.obstacleIndex < 0 || args.obstacleIndex >= newObstacles.length) {
      throw new Error("Problémový bod na tomto indexu neexistuje");
    }

    // 4. Nahradíme starý bod tím novým upraveným
    newObstacles[args.obstacleIndex] = args.updatedObstacle;

    // 5. Uložíme celé pole zpět do databáze
    await ctx.db.patch(args.roofId, {
      obstacles: newObstacles,
    });
  },
});

export const updateRoofDimensions = mutation({
  args: {
    roofId: v.id("roofs"),
    // Uděláme argumenty volitelné (v.optional), abyste mohl
    // z Reactu poslat ke změně třeba jen šířku, nebo jen výšku, nebo obojí
    roofWidth: v.optional(v.number()),
    roofHeight: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Připravíme si objekt jen s těmi daty, která reálně přišla
    const updates: Record<string, number> = {};
    if (args.roofWidth !== undefined) updates.roofWidth = args.roofWidth;
    if (args.roofHeight !== undefined) updates.roofHeight = args.roofHeight;

    // Patch automaticky updatuje jen dodaná pole a "obstacles" zůstanou jak byly
    await ctx.db.patch(args.roofId, updates);
  },
});

export const deleteRoof = mutation({
  args: {
    roofId: v.id("roofs"), // ID střechy, kterou chceme smazat
  },
  handler: async (ctx, args) => {
    // Smaže celou střechu včetně jejího pole "obstacles"
    await ctx.db.delete(args.roofId);
  },
});

// 2. SMAZÁNÍ ÚPLNĚ VŠECH STŘECH (Ideální např. při testování)
export const deleteAllRoofs = mutation({
  // Nepotřebujeme žádné argumenty, mažeme všechno
  args: {},
  handler: async (ctx) => {
    // 1. Nejdříve vytáhneme všechny existující střechy z databáze
    const allRoofs = await ctx.db.query("roofs").collect();

    // 2. Projdeme je a všechny je paralelně smažeme
    // Používáme Promise.all pro zrychlení, protože nemusíme čekat
    // na smazání jedné, abychom mohli začít mazat druhou
    await Promise.all(allRoofs.map((roof) => ctx.db.delete(roof._id)));
  },
});

export const removeObstacle = mutation({
  args: {
    roofId: v.id("roofs"),
    obstacleIndex: v.number(), // Index překážky, kterou chceme smazat
  },
  handler: async (ctx, args) => {
    const roof = await ctx.db.get(args.roofId);
    if (!roof) throw new Error("Střecha nenalezena");

    const newObstacles = [...roof.obstacles];
    // splice odstraní 1 prvek na daném indexu
    newObstacles.splice(args.obstacleIndex, 1);

    await ctx.db.patch(args.roofId, {
      obstacles: newObstacles,
    });
  },
});
