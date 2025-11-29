import * as THREE from 'three';
import { createNoise2D } from 'simplex-noise'; 
import { RNG } from './rng';
import { blocks } from './blocks'; // Asume que 'blocks' contiene {empty: {id: 0, ...}, grass: {id: 1, color: 0x...}, ...}

// 🧱 Definición de la Geometría Base (Deben estar disponibles en el scope)
const geometry = new THREE.BoxGeometry(1, 1, 1); 
const material = new THREE.MeshLambertMaterial({ color: 0x7FFFD4 });

export class World extends THREE.Group {
    data = []; 

    params = {
        terrain: {
            seed: 0,
            scale: 30, 
            magnitude: 0.5,
            offset: 0.2
        }
    }
    
    constructor(size = { width: 8, height: 16 }) {
        super();
        this.size = size;
    }

    // 🚀 generate: Orquesta los pasos
    generate() {
        this.initializeTerrain(); 
        this.generateTerrain();  
        this.generateMeshes();   
    }

    // 💾 initializeTerrain: Crea la estructura de datos vacía
    initializeTerrain() {
        this.data = []; 
        for (let x = 0; x < this.size.width; x++) {
            const slice = [];
            for (let y = 0; y < this.size.height; y++) {
                const row = [];
                for (let z = 0; z < this.size.width; z++) { 
                    row.push({
                        id: blocks.empty.id,
                        instanceId: null
                    });
                }
                slice.push(row);
            }
            this.data.push(slice);
        }
    }

    // 🏔️ generateTerrain: Calcula elevaciones y llena los datos
    generateTerrain() {
        const rng = new RNG(this.params.seed);
        const noise2D = createNoise2D(rng.random.bind(rng)); 

        for (let x = 0; x < this.size.width; x++) {
            for (let z = 0; z < this.size.width; z++) {

                const value = noise2D(
                    x / this.params.terrain.scale, 
                    z / this.params.terrain.scale
                );

                const scaledNoise = this.params.terrain.offset + this.params.terrain.magnitude * value;
                let height = this.size.height * scaledNoise;
                
                height = Math.max(0, Math.min(Math.floor(height), this.size.height - 1));

                for (let y = 0; y <= height; y++) {
                    if (y < height) {
                        this.setBlockId(x, y, z, blocks.dirt.id);
                    } else if (y === height) {
                        this.setBlockId(x, y, z, blocks.grass.id);
                    } else {
                        this.setBlockId(x, y, z, blocks.empty.id);
                    }
                }
            }
        }
    }

    // 🖼️ generateMeshes: Renderizado eficiente con Culling
    generateMeshes() {
        this.clear();

        const maxCount = this.size.width * this.size.width * this.size.height;
        const mesh = new THREE.InstancedMesh(geometry, material, maxCount);
        mesh.count = 0;
        mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(maxCount * 3), 3);
        
        const matrix = new THREE.Matrix4();
        const color = new THREE.Color();
        const blockTypes = Object.values(blocks); 

        for (let x = 0; x < this.size.width; x++) {
            for (let y = 0; y < this.size.height; y++) {
                for (let z = 0; z < this.size.width; z++) {
                    
                    const blockData = this.getBlock(x, y, z); 
                    const blockId = blockData.id;
                    const instanceId = mesh.count;

                    // 🎯 LÓGICA DE OPTIMIZACIÓN IMPLEMENTADA:
                    // Renderiza si NO es aire Y NO está completamente oculto.
                    if (blockId !== blocks.empty.id && !this.isBlockObscured(x, y, z)) {
                        
                        // a) Posición
                        matrix.setPosition(x + 0.5, y + 0.5, z + 0.5);
                        mesh.setMatrixAt(instanceId, matrix);

                        // b) Color
                        const blockType = blockTypes.find(b => b.id === blockId);
                        
                        if (blockType && blockType.color) {
                                color.set(blockType.color);
                        } else {
                                color.set(0xaaaaaa); 
                        }
                        mesh.setColorAt(instanceId, color); 
                        
                        // c) Actualizar datos internos
                        this.setBlockInstanceId(x, y, z, instanceId);

                        mesh.count++;
                    }
                }
            }
        }
        
        mesh.instanceMatrix.needsUpdate = true;
        mesh.instanceColor.needsUpdate = true;

        this.add(mesh);
    }

    // --- Métodos de Acceso y Optimización ---

    /**
     * @returns {object | null} El objeto del bloque en (x, y, z) o null si está fuera de límites.
     */
    getBlock(x, y, z) { 
        if (this.inBounds(x, y, z)) { 
            return this.data[x][y][z]; 
        } else {
            return null;
        }
    }

    setBlockId(x, y, z, id) {
        if (this.inBounds(x, y, z)) {
            this.data[x][y][z].id = id; 
        }
    }

    setBlockInstanceId(x, y, z, instanceId) {
        if (this.inBounds(x, y, z)) {
            this.data[x][y][z].instanceId = instanceId; 
        }
    }

    /**
     * @returns {boolean} True si las coordenadas están dentro de los límites del mundo.
     */
    inBounds(x, y, z) { 
        return (
            x >= 0 && x < this.size.width && 
            y >= 0 && y < this.size.height && 
            z >= 0 && z < this.size.width
        );
    }

    /**
     * **(Función de la imagen)** Devuelve true si el bloque está completamente rodeado
     * por otros bloques (ninguna de sus 6 caras toca un bloque vacío).
     * @param {number} x Coordenada X.
     * @param {number} y Coordenada Y.
     * @param {number} z Coordenada Z.
     * @returns {boolean} True si está oculto, false si al menos una cara está expuesta.
     */
    isBlockObscured(x, y, z) {
        // Obtenemos el ID que representa un bloque vacío/aire
        const EMPTY_ID = blocks.empty.id;

        // Intentamos obtener el ID del bloque vecino. Si el bloque no existe (fuera de límites), 
        // asumimos que es EMPTY_ID para que siempre parezca expuesto.
        const up      = this.getBlock(x, y + 1, z)?.id ?? EMPTY_ID;
        const down    = this.getBlock(x, y - 1, z)?.id ?? EMPTY_ID;
        const left    = this.getBlock(x + 1, y, z)?.id ?? EMPTY_ID;
        const right   = this.getBlock(x - 1, y, z)?.id ?? EMPTY_ID;
        const forward = this.getBlock(x, y, z + 1)?.id ?? EMPTY_ID;
        const back    = this.getBlock(x, y, z - 1)?.id ?? EMPTY_ID;
        
        // Si cualquiera de los vecinos es aire (EMPTY_ID), significa que una cara está expuesta.
        // Por lo tanto, el bloque NO está oculto.
        if (up      === EMPTY_ID ||
            down    === EMPTY_ID ||
            left    === EMPTY_ID ||
            right   === EMPTY_ID ||
            forward === EMPTY_ID ||
            back    === EMPTY_ID) 
        {
            return false; 
        } 
        
        // Si llegamos aquí, todos los vecinos son bloques sólidos. El bloque SÍ está oculto.
        return true; 
    }

    /**
     * Método alternativo que devuelve un objeto indicando qué caras están expuestas (útil para future Face Culling)
     */
    getExposedFaces(x, y, z) {
        const EMPTY_ID = blocks.empty.id;
        
        return {
            up:      this.getBlock(x, y + 1, z)?.id === EMPTY_ID,
            down:    this.getBlock(x, y - 1, z)?.id === EMPTY_ID,
            left:    this.getBlock(x + 1, y, z)?.id === EMPTY_ID,
            right:   this.getBlock(x - 1, y, z)?.id === EMPTY_ID,
            forward: this.getBlock(x, y, z + 1)?.id === EMPTY_ID,
            back:    this.getBlock(x, y, z - 1)?.id === EMPTY_ID
        };
    }
}