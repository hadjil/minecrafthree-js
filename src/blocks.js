// blocks.ts

export const blocks = {
    empty: { id: 0, name: 'Empty', color: 0x000000 },
    // Pasto puro (se usará para la parte superior de los cubos y para los cubos de pasto rodeados)
    grass: { id: 1, name: 'Grass', color: 0x55aa00 }, 
    // Tierra pura (se usará para cubos de tierra subterránea)
    dirt:  { id: 2, name: 'Dirt',  color: 0x8b4513 }, 
    stone: { 
        id: 3, name: 'Stone', color: 0x808080, 
        scale: { x: 20, y: 15, z: 20 }, scarcity: 0.8 
    },
    coalOre: { 
        id: 4, name: 'Coal Ore', color: 0x333333, 
        scale: { x: 10, y: 10, z: 10 }, scarcity: 0.95 
    },
    ironOre: { 
        id: 5, name: 'Iron Ore', color: 0xffa500, 
        scale: { x: 5, y: 5, z: 5 }, scarcity: 0.98 
    },
    // NUEVO BLOQUE: Textura de pasto arriba y tierra a los lados (para cubos de pasto expuestos)
    grass_side_dirt: { id: 6, name: 'Grass_Side_Dirt', color: 0x8b4513 } 
};