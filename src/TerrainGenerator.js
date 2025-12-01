// TerrainGenerator.ts

import { createNoise2D, createNoise3D } from 'simplex-noise';
import { blocks } from './blocks';

export class TerrainGenerator {
    constructor(seed, params) {
        this.params = params;
        this.simplex2D = createNoise2D(seed);
        this.simplex3D = createNoise3D(seed);
    }

    generate(data, size, startX = 0, startZ = 0) { // <-- Se mantiene la firma simple, asumiendo que ya hay coordenadas absolutas si fuera necesario.
        this.generateResources(data, size, startX, startZ);
        this.generateTerrain(data, size, startX, startZ);
        this.applyGrassBlockVariants(data, size);
    }

    _setBlock(data, size, x, y, z, id) {
        if (x >= 0 && x < size.width && y >= 0 && y < size.height && z >= 0 && z < size.width) {
            if (data[x] && data[x][y] && data[x][y][z]) {
                data[x][y][z].id = id;
            }
        }
    }

    // 💡 Método para obtener el objeto bloque (útil para modificarlo)
    _getBlock(data, size, x, y, z) {
        if (x >= 0 && x < size.width && y >= 0 && y < size.height && z >= 0 && z < size.width) {
            if (data[x] && data[x][y] && data[x][y][z]) {
                 return data[x][y][z];
            }
        }
        return null;
    }
    
    // 💡 NUEVO Método para obtener solo el ID de bloque, 
    // devolviendo blocks.empty.id si está fuera de rango. Esto es CRÍTICO para los bordes.
    _getBlockId(data, size, x, y, z) {
        if (x >= 0 && x < size.width && y >= 0 && y < size.height && z >= 0 && z < size.width) {
            if (data[x] && data[x][y] && data[x][y][z]) {
                 return data[x][y][z].id;
            }
        }
        return blocks.empty.id; // Asume aire fuera del chunk
    }

    // He mantenido la inyección de startX/startZ en generateResources y generateTerrain 
    // como una buena práctica para la generación de ruido, asumiendo que tu sistema lo necesita
    // para un mundo infinito. Si no lo necesitas, simplemente ignora startX/startZ aquí.
    generateResources(data, size, startX = 0, startZ = 0) {
        const resources = Object.values(blocks).filter(b => b.scale && b.scarcity);
        const MAX_H = Math.floor(size.height * 0.90);

        for (let x = 0; x < size.width; x++) {
            for (let y = 0; y < size.height; y++) {
                for (let z = 0; z < size.width; z++) {
                    if (y >= MAX_H) continue;
                    
                    const absX = x + startX;
                    const absZ = z + startZ;

                    // Piedra base
                    const stoneVal = this.simplex3D(absX / blocks.stone.scale.x, y / blocks.stone.scale.y, absZ / blocks.stone.scale.z);
                    if (stoneVal > (blocks.stone.scarcity + (1 - y / MAX_H) * 0.05)) {
                        this._setBlock(data, size, x, y, z, blocks.stone.id);
                    }

                    // Minerales
                    for (const ore of resources) {
                        if (ore.id === blocks.stone.id) continue;
                        const oreVal = this.simplex3D(absX / ore.scale.x, y / ore.scale.y, absZ / ore.scale.z);
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

    generateTerrain(data, size, startX = 0, startZ = 0) {
        const { scale, magnitude, offset, dirtLayerThickness, rockOutcropProbability } = this.params.terrain;
        const rng = () => Math.random();

        for (let x = 0; x < size.width; x++) {
            for (let z = 0; z < size.width; z++) {
                const absX = x + startX;
                const absZ = z + startZ;
                
                const value = this.simplex2D(absX / scale, absZ / scale);
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
     * Aplica variantes de bloques de pasto (grass vs. grass_side_dirt).
     * Esta es la fuente más probable de costuras de TEXTURA.
     */
    applyGrassBlockVariants(data, size) {
        for (let x = 0; x < size.width; x++) {
            for (let y = 0; y < size.height; y++) {
                for (let z = 0; z < size.width; z++) {
                    const block = this._getBlock(data, size, x, y, z);

                    // Solo nos interesa si es un bloque de GRASS
                    if (block && block.id === blocks.grass.id) {
                        
                        // Aseguramos que sea un bloque de superficie (tiene aire arriba)
                        const hasAirAbove = this._getBlockId(data, size, x, y + 1, z) === blocks.empty.id; // 💡 USAR _getBlockId

                        if (hasAirAbove) {
                            // Comprobamos si alguno de los lados X o Z está expuesto al aire
                            const isExposedLaterally = 
                                this._getBlockId(data, size, x + 1, y, z) === blocks.empty.id || // 💡 USAR _getBlockId
                                this._getBlockId(data, size, x - 1, y, z) === blocks.empty.id || // 💡 USAR _getBlockId
                                this._getBlockId(data, size, x, y, z + 1) === blocks.empty.id || // 💡 USAR _getBlockId
                                this._getBlockId(data, size, x, y, z - 1) === blocks.empty.id; // 💡 USAR _getBlockId

                            if (isExposedLaterally) {
                                // Si está expuesto, usamos el bloque con lados de tierra
                                this._setBlock(data, size, x, y, z, blocks.grass_side_dirt.id); 
                            }
                        }
                    }
                }
            }
        }
    }
}