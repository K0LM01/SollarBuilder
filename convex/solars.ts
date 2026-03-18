// convex/solars.ts
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ==========================================
// ZÍSKÁNÍ VŠECH STŘECH KTERÉ MOHU VIDĚT
// ==========================================
export const getSolars = query({
  handler: async (ctx) => {
    // 1. Ověříme, že je uživatel přihlášený (získáme jeho Clerk ID)
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      // Pokud se ptá někdo nepřihlášený, vrátíme prázdné pole místo chyby,
      // aby to aplikaci nepadalo při odhlašování.
      return [];
    }

    const userId = identity.subject;

    // 2. Stáhneme úplně všechny střechy, seřazené od nejnovějších
    const allRoofs = await ctx.db.query("roofs").order("desc").collect();

    // 3. V JavaScriptu vyfiltrujeme jen ty, které patří uživateli
    // NEBO ke kterým byl přizván (sdíleno)
    const myRoofs = allRoofs.filter((roof) => {
      const isOwner = roof.ownerId === userId;
      // .includes() umí zjistit, jestli se v poli "sharedWith" nachází moje ID
      const isShared = roof.sharedWith && roof.sharedWith.includes(userId);
      return isOwner || isShared;
    });

    return myRoofs;
  },
});

// ==========================================
// PŘIDÁNÍ NOVÉ STŘECHY
// ==========================================
export const addRoof = mutation({
  args: {
    name: v.string(),
    roofWidth: v.number(),
    roofHeight: v.number(),
  },
  handler: async (ctx, args) => {
    // Musíme ověřit uživatele, než mu dovolíme cokoliv vytvořit
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Nejste přihlášeni - nemůžete vytvářet projekty.");
    }
    const userId = identity.subject;

    // Vložíme novou střechu včetně majitele a pole pro sdílení
    return await ctx.db.insert("roofs", {
      name: args.name,
      roofWidth: args.roofWidth,
      roofHeight: args.roofHeight,
      obstacles: [],
      ownerId: userId,
      sharedWith: [], // Zpočátku nesdíleno s nikým
    });
  },
});

// ==========================================
// INSERT PROBLÉMOVÉ BODY
// ==========================================
export const addObstacle = mutation({
  args: {
    roofId: v.id("roofs"),
    newObstacle: v.any(),
  },
  handler: async (ctx, args) => {
    // Přidat bezpečnost by se dalo i sem, ale předpokládáme, že ID střechy zná jen oprávněný
    const existingRoof = await ctx.db.get(args.roofId);
    if (!existingRoof) throw new Error("Střecha nebyla nalezena!");

    const updateObstacles = [...existingRoof.obstacles, args.newObstacle];

    await ctx.db.patch(args.roofId, {
      obstacles: updateObstacles,
    });
  },
});

// ==========================================
// UPDATE PROBLÉMOVÉHO BODU
// ==========================================
export const updateObstacle = mutation({
  args: {
    roofId: v.id("roofs"),
    obstacleIndex: v.number(),
    updatedObstacle: v.any(),
  },
  handler: async (ctx, args) => {
    const roof = await ctx.db.get(args.roofId);
    if (!roof) throw new Error("Střecha nenalezena");

    const newObstacles = [...roof.obstacles];

    if (args.obstacleIndex < 0 || args.obstacleIndex >= newObstacles.length) {
      throw new Error("Problémový bod na tomto indexu neexistuje");
    }

    newObstacles[args.obstacleIndex] = args.updatedObstacle;

    await ctx.db.patch(args.roofId, {
      obstacles: newObstacles,
    });
  },
});

// ==========================================
// ZMĚNA ROZMĚRŮ STŘECHY
// ==========================================
export const updateRoofDimensions = mutation({
  args: {
    roofId: v.id("roofs"),
    roofWidth: v.optional(v.number()),
    roofHeight: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const updates: Record<string, number> = {};
    if (args.roofWidth !== undefined) updates.roofWidth = args.roofWidth;
    if (args.roofHeight !== undefined) updates.roofHeight = args.roofHeight;

    await ctx.db.patch(args.roofId, updates);
  },
});

// ==========================================
// SMAZÁNÍ JEDNÉ STŘECHY
// ==========================================
export const deleteRoof = mutation({
  args: {
    roofId: v.id("roofs"),
  },
  handler: async (ctx, args) => {
    // Tady bychom správně měli zkontrolovat, zda střechu maže její VLASTNÍK!
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Nejste přihlášeni");

    const roof = await ctx.db.get(args.roofId);
    if (!roof) throw new Error("Střecha nenalezena");

    // Ochrana: Smazat to může jen ten, kdo to vytvořil
    if (roof.ownerId !== identity.subject) {
      throw new Error("Nemáš práva smazat tento projekt!");
    }

    await ctx.db.delete(args.roofId);
  },
});

// ==========================================
// SMAZÁNÍ VŠECH STŘECH (jen pro testování - pročištěno na MOJE střechy)
// ==========================================
export const deleteAllRoofs = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Nejste přihlášeni");

    const allRoofs = await ctx.db.query("roofs").collect();

    // Filtrujeme jen na ty moje, abych omylem nesmazal práci cizího kolegy!
    const myRoofs = allRoofs.filter((r) => r.ownerId === identity.subject);

    await Promise.all(myRoofs.map((roof) => ctx.db.delete(roof._id)));
  },
});

// ==========================================
// SMAZÁNÍ PŘEKÁŽKY
// ==========================================
export const removeObstacle = mutation({
  args: {
    roofId: v.id("roofs"),
    obstacleIndex: v.number(),
  },
  handler: async (ctx, args) => {
    const roof = await ctx.db.get(args.roofId);
    if (!roof) throw new Error("Střecha nenalezena");

    const newObstacles = [...roof.obstacles];
    newObstacles.splice(args.obstacleIndex, 1);

    await ctx.db.patch(args.roofId, {
      obstacles: newObstacles,
    });
  },
});

// ==========================================
// SPOLUPRACOVNÍK: ODEBRAT SÁM SEBE ZE SDÍLENÍ
// ==========================================
export const leaveSharedRoof = mutation({
  args: { roofId: v.id("roofs") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Nejste přihlášeni");

    const roof = await ctx.db.get(args.roofId);
    if (!roof) throw new Error("Projekt nenalezen");

    // Vlastník by měl spíš použít revokeSharing nebo deleteRoof,
    // ale kdyby zavolal tohle, nic se nezkazí.
    const currentShared = roof.sharedWith || [];

    // Odstraníme z sharedWith aktuálního uživatele
    const newShared = currentShared.filter((id) => id !== identity.subject);

    await ctx.db.patch(args.roofId, {
      sharedWith: newShared,
    });
  },
});

// ==========================================
// ULOŽENÍ STAVU PANELŮ NA STŘEŠE
// ==========================================
export const updatePanels = mutation({
  args: {
    roofId: v.id("roofs"),
    panelConfig: v.optional(v.any()),
    panelLayout: v.optional(v.any()),
    savedPosition: v.optional(v.object({ x: v.number(), y: v.number() })),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.roofId, {
      panelConfig: args.panelConfig,
      panelLayout: args.panelLayout,
      savedPosition: args.savedPosition,
    });
  },
});

// ==========================================
// ZRUŠENÍ SPOLUPRÁCE (ODSTRANĚNÍ VŠECH KOLEGŮ)
// ==========================================
export const revokeSharing = mutation({
  args: { roofId: v.id("roofs") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Nejste přihlášeni");

    const roof = await ctx.db.get(args.roofId);
    if (!roof) throw new Error("Projekt nenalezen");

    // Zrušit sdílení smí jen opravdový vlastník
    if (roof.ownerId !== identity.subject) {
      throw new Error("Pouze vlastník může zrušit sdílení");
    }

    // Vyprázdníme pole s IDčkama kolegů
    await ctx.db.patch(args.roofId, {
      sharedWith: [],
    });
  },
});

// ==========================================
// NOVÉ: SDÍLENÍ PROJEKTU S KOLEGOU
// ==========================================
export const shareRoof = mutation({
  args: {
    roofId: v.id("roofs"),
    collaboratorEmail: v.string(), // Chtěli bychom e-mail, ale Clerk ID je snazší - zatím to nasimulujeme.
    collaboratorId: v.string(), // IDčko toho, komu to posíláme
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Nejste přihlášeni");

    const roof = await ctx.db.get(args.roofId);
    if (!roof) throw new Error("Projekt nenalezen");

    if (roof.ownerId !== identity.subject) {
      throw new Error("Sdílet mohou pouze majitelé projektu");
    }

    const currentShared = roof.sharedWith || [];
    if (!currentShared.includes(args.collaboratorId)) {
      currentShared.push(args.collaboratorId);

      await ctx.db.patch(args.roofId, {
        sharedWith: currentShared,
      });
    }
  },
});
