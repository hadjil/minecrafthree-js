import * as THREE from 'three';
import RNG from './rng'; 
import { blocks } from './blocks'; 
import { TerrainGenerator } from './TerrainGenerator';
import { TextureFactory } from './TextureFactory'; 

export class World extends THREE.Group {
    data = [];
    
    // Geometría base
    blockGeometry = new THREE.BoxGeometry(1, 1, 1);
    
    // MATERIAL OPTIMIZADO: Lambert con soporte para Atlas
    defaultMaterial = new THREE.MeshLambertMaterial({ 
        map: null, 
        side: THREE.FrontSide
    });
    
    instancedMesh = null;
    dummy = new THREE.Object3D(); 
    
    // 🔥 Se eliminan las variables de Frustum Culling (frustum, blockBox, blockCenter)
    
    params = {
        terrain: {
            seed: 0, scale: 30, magnitude: 0.5, offset: 0.2,
            dirtLayerThickness: 3, rockOutcropProbability: 0.1
        }
    }

    constructor(size = { width: 8, height: 16 }) {
        super();
        this.size = size;

        // 1. GENERAR TEXTURA PROCEDURAL (Hybrid Atlas)
        const { texture, blockCount } = TextureFactory.generateTextureAtlas();
        this.defaultMaterial.map = texture;

        // 2. SHADER INJECTION: Modificar el material para mapear la textura por cara
        this.defaultMaterial.onBeforeCompile = (shader) => {
            shader.uniforms.atlasSize = { value: blockCount };
            
            // Vertex Shader: Recibir atributos y pasar VARYINGs
            shader.vertexShader = `
                attribute float blockType;
                varying float vBlockType;
                varying vec2 vUv;
                varying vec3 vNormalWorld; 

                ${shader.vertexShader}
            `.replace(
                '#include <begin_vertex>',
                `
                #include <begin_vertex>
                vBlockType = blockType;
                vUv = uv;
                vNormalWorld = normalize( mat3( instanceMatrix ) * normal ); 
                `
            );

            // Fragment Shader: Lógica para forzar la tapa verde
            shader.fragmentShader = `
                uniform float atlasSize;
                varying float vBlockType;
                varying vec2 vUv; 
                varying vec3 vNormalWorld;
                
                const float GRASS_PURE_ID = 1.0; 

                ${shader.fragmentShader}
            `.replace(
                '#include <map_fragment>',
                `
                // 1. Decidir qué ID de textura base usar (por defecto el ID del bloque)
                float targetBlockId = vBlockType;
                
                // 2. Comprobar si es la cara superior (Normal Y positiva)
                if (dot(vNormalWorld, vec3(0.0, 1.0, 0.0)) > 0.9) { 
                    if (vBlockType != 0.0) { 
                        targetBlockId = GRASS_PURE_ID;
                    }
                } 
                
                // 3. Aplicar el mapeo del Atlas (usando el ID decidido por la cara)
                vec2 atlasUV = vUv;
                
                float row = atlasSize - 1.0 - targetBlockId; 
                
                atlasUV.y /= atlasSize; 
                atlasUV.y += (row / atlasSize);

                vec4 sampledDiffuseColor = texture2D( map, atlasUV );
                diffuseColor *= sampledDiffuseColor;
                `
            );
        };

        const rng = new RNG(this.params.terrain.seed);
        this.generator = new TerrainGenerator(rng.random.bind(rng), this.params);
    }

// --- Métodos de la clase ---

    generate() {
        this.dispose();
        this.initDataStructure();
        this.generator.generate(this.data, this.size);
        this.generateMeshes();
    }

    initDataStructure() {
        this.data = [];
        for (let x = 0; x < this.size.width; x++) {
            const slice = [];
            for (let y = 0; y < this.size.height; y++) {
                const row = [];
                for (let z = 0; z < this.size.width; z++) {
                    row.push({ id: blocks.empty.id, instanceId: null });
                }
                slice.push(row);
            }
            this.data.push(slice);
        }
    }

    /**
     * Genera la InstancedMesh con Face Culling.
     */
    generateMeshes() {
        let count = 0;
        for (let x = 0; x < this.size.width; x++) {
            for (let y = 0; y < this.size.height; y++) {
                for (let z = 0; z < this.size.width; z++) {
                    if (!this.isBlockObscured(x, y, z)) count++;
                }
            }
        }

        if (count === 0) return;

        this.instancedMesh = new THREE.InstancedMesh(this.blockGeometry, this.defaultMaterial, count);
        this.instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        
        this.instancedMesh.castShadow = true;   
        this.instancedMesh.receiveShadow = true; 
        
        const blockTypes = new Float32Array(count); 
        this.instancedMesh.geometry.setAttribute('blockType', new THREE.InstancedBufferAttribute(blockTypes, 1));
        
        let i = 0;
        for (let x = 0; x < this.size.width; x++) {
            for (let y = 0; y < this.size.height; y++) {
                for (let z = 0; z < this.size.width; z++) {
                    
                    const blockData = this.data[x][y][z];
                    
                    if (this.isBlockObscured(x, y, z)) {
                        blockData.instanceId = null;
                        continue;
                    }

                    this.dummy.position.set(x, y, z);
                    this.dummy.updateMatrix();
                    this.instancedMesh.setMatrixAt(i, this.dummy.matrix);

                    blockTypes[i] = blockData.id;

                    blockData.instanceId = i;
                    i++;
                }
            }
        }
        
        this.add(this.instancedMesh);
    }

    isBlockObscured(x, y, z) {
        const block = this.getBlock(x, y, z);
        if (!block || block.id === blocks.empty.id) return true;

        if (y === this.size.height - 1) return false;

        const check = (dx, dy, dz) => {
            const n = this.getBlock(x + dx, y + dy, z + dz);
            return n && n.id !== blocks.empty.id;
        };

        // Verifica si está rodeado en los 6 lados (Face Culling)
        return check(0,1,0) && check(0,-1,0) && check(1,0,0) && check(-1,0,0) && check(0,0,1) && check(0,0,-1);
    }

    // 🔥 ELIMINAMOS el método cullByFrustum.

    dispose() {
        if (this.instancedMesh) {
            this.instancedMesh.geometry.dispose();
            this.remove(this.instancedMesh);
            this.instancedMesh = null;
        }
    }

    getBlock(x, y, z) {
        if (x >= 0 && x < this.size.width && y >= 0 && y < this.size.height && z >= 0 && z < this.size.width) {
            return this.data[x][y][z];
        }
        return null;
    }
}