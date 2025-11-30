// TerrainGenerator.ts

import { createNoise2D, createNoise3D } from 'simplex-noise';
import { blocks } from './blocks';

export class TerrainGenerator {
    constructor(seed, params) {
        this.params = params;
        this.simplex2D = createNoise2D(seed);
        this.simplex3D = createNoise3D(seed);
    }

    generate(data, size) {
        this.generateResources(data, size);
        this.generateTerrain(data, size);
        this.applyGrassBlockVariants(data, size); // <-- ¡NUEVA FUNCIÓN REFINADA!
    }

    _setBlock(data, size, x, y, z, id) {
        if (x >= 0 && x < size.width && y >= 0 && y < size.height && z >= 0 && z < size.width) {
            if (data[x] && data[x][y] && data[x][y][z]) {
                data[x][y][z].id = id;
            }
        }
    }

    _getBlock(data, size, x, y, z) {
        if (x >= 0 && x < size.width && y >= 0 && y < size.height && z >= 0 && z < size.width) {
            if (data[x] && data[x][y] && data[x][y][z]) {
                 return data[x][y][z];
            }
        }
        return null;
    }

    generateResources(data, size) {
        const resources = Object.values(blocks).filter(b => b.scale && b.scarcity);
        const MAX_H = Math.floor(size.height * 0.90);

        for (let x = 0; x < size.width; x++) {
            for (let y = 0; y < size.height; y++) {
                for (let z = 0; z < size.width; z++) {
                    if (y >= MAX_H) continue;

                    // Piedra base
                    const stoneVal = this.simplex3D(x / blocks.stone.scale.x, y / blocks.stone.scale.y, z / blocks.stone.scale.z);
                    if (stoneVal > (blocks.stone.scarcity + (1 - y / MAX_H) * 0.05)) {
                        this._setBlock(data, size, x, y, z, blocks.stone.id);
                    }

                    // Minerales
                    for (const ore of resources) {
                        if (ore.id === blocks.stone.id) continue;
                        const oreVal = this.simplex3D(x / ore.scale.x, y / ore.scale.y, z / ore.scale.z);
                        if (oreVal > (ore.scarcity + (1 - y / MAX_H) * 0.1)) {
                            const current = this._getBlock(data, size, x, y, z)?.id;
                            if (current === blocks.empty.id || current === blocks.stone.id) {
                                this._setBlock(data, size, x, y, z, ore.id);
                                break;
                            }
                        }
                    }
                }
            }
        }
    }

    generateTerrain(data, size) {
        const { scale, magnitude, offset, dirtLayerThickness, rockOutcropProbability } = this.params.terrain;
        const rng = () => Math.random();

        for (let x = 0; x < size.width; x++) {
            for (let z = 0; z < size.width; z++) {
                const value = this.simplex2D(x / scale, z / scale);
                let height = Math.floor(size.height * (offset + magnitude * value));
                height = Math.max(0, Math.min(height, size.height - 1));

                for (let y = 0; y <= size.height - 1; y++) {
                    const currentBlock = this._getBlock(data, size, x, y, z);
                    const currentId = currentBlock ? currentBlock.id : blocks.empty.id;

                    if (y > height) {
                        this._setBlock(data, size, x, y, z, blocks.empty.id);
                    } else if (y === height) {
                        // Superficie (Inicialmente todo pasto, luego applyGrassBlockVariants lo refina)
                        const isRock = currentId === blocks.stone.id || currentId === blocks.coalOre.id || currentId === blocks.ironOre.id;
                        if (isRock && rng() < rockOutcropProbability) {
                            this._setBlock(data, size, x, y, z, currentId);
                        } else {
                            this._setBlock(data, size, x, y, z, blocks.grass.id);
                        }
                    } else {
                        // Subsuelo (Capa de tierra o minerales)
                        const depth = height - y;
                        if (depth <= dirtLayerThickness) {
                            const isRock = currentId === blocks.stone.id || currentId === blocks.coalOre.id || currentId === blocks.ironOre.id;
                            if (!isRock) {
                                this._setBlock(data, size, x, y, z, blocks.dirt.id);
                            }
                        }
                    }
                }
            }
        }
    }

    /**
     * Aplica variantes de bloques de pasto (grass vs. grass_side_dirt)
     */
    applyGrassBlockVariants(data, size) {
        for (let x = 0; x < size.width; x++) {
            for (let y = 0; y < size.height; y++) {
                for (let z = 0; z < size.width; z++) {
                    const block = this._getBlock(data, size, x, y, z);

                    // Solo nos interesa si es un bloque de GRASS
                    if (block && block.id === blocks.grass.id) {
                        // Aseguramos que sea un bloque de superficie (tiene aire arriba)
                        const hasAirAbove = this._getBlock(data, size, x, y + 1, z)?.id === blocks.empty.id;

                        if (hasAirAbove) {
                            // Comprobamos si alguno de los lados X o Z está expuesto al aire
                            const isExposedLaterally = 
                                this._getBlock(data, size, x + 1, y, z)?.id === blocks.empty.id ||
                                this._getBlock(data, size, x - 1, y, z)?.id === blocks.empty.id ||
                                this._getBlock(data, size, x, y, z + 1)?.id === blocks.empty.id ||
                                this._getBlock(data, size, x, y, z - 1)?.id === blocks.empty.id;

                            if (isExposedLaterally) {
                                // Si está expuesto, usamos el bloque con lados de tierra
                                this._setBlock(data, size, x, y, z, blocks.grass_side_dirt.id); 
                            }
                            // Si NO está expuesto lateralmente, se queda como blocks.grass.id
                        }
                    }
                }
            }
        }
    }
}