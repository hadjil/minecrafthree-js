import * as THREE from 'three'
// Importación corregida para el add-on SimplexNoise
import { SimplexNoise } from 'three/examples/jsm/math/SimplexNoise.js'; 

const geometry = new THREE.BoxGeometry(1, 1, 1); // Asegura que el tamaño sea 1 para coordenadas enteras
// Usamos MeshLambertMaterial para un aspecto estilo voxel simple si tienes luces, o MeshStandardMaterial si usas luces más modernas
const material = new THREE.MeshLambertMaterial({ color: 0x7FFFD4 }) 

export class World extends THREE.Group {
    /** * @type{{id:number,instanceId:number | null}[][][]}
     * */
    data = []; // Inicializamos como array vacío, se llenará en initializeTerrain

    params = {
        terrain: {
            scale: 30,
            magnitude: 0.5,
            offset: 0.2
        }
    }
    threshold = 0.5;
    
    /**
     * @param {object} [size] - Dimensiones del mundo.
     * @param {number} [size.width] - Ancho (X y Z).
     * @param {number} [size.height] - Altura (Y).
     */
    constructor(size = { width: 8, height: 16 }) {
        super();
        this.size = size;
    }

    /**
     * Obtiene los datos del bloque en las coordenadas (x,y,z).
     * @param {number} x
     * @param {number} y
     * @param {number} z
     * @returns{{id:number,instanceId:number | null} | null}
     */
    getBlock(x, y, z) { 
        if (this.inBounds(x, y, z)) { 
            // Acceso seguro asumiendo que data está correctamente inicializada
            return this.data[x][y][z]; 
        } else {
            return null;
        }
    }

    /**
     * Establece el instanceId del bloque en las coordenadas (x,y,z).
     * @param {number} x
     * @param {number} y
     * @param {number} z
     * @param {number | null} instanceId
     */
    setBlockInstanceId(x, y, z, instanceId) {
        if (this.inBounds(x, y, z)) {
            // Se asume que el objeto bloque existe ya
            this.data[x][y][z].instanceId = instanceId; 
        }
    }

    /**
     * Establece el ID del bloque en las coordenadas (x,y,z).
     * @param {number} x
     * @param {number} y
     * @param {number} z
     * @param {number} id
     */
    setBlockId(x, y, z, id) {
        if (this.inBounds(x, y, z)) {
            // Se asume que el objeto bloque existe ya
            this.data[x][y][z].id = id; 
        }
    }

    /**
     * Verifica si las coordenadas están dentro de los límites del mundo.
     * @param {number} x
     * @param {number} y
     * @param {number} z
     * @returns {boolean}
     */
    inBounds(x, y, z) { 
        return (
            x >= 0 && x < this.size.width && 
            y >= 0 && y < this.size.height && 
            z >= 0 && z < this.size.width // Asumiendo Z usa width
        );
    }

    // Método principal para generar el mundo
    generate() {
        this.initializeTerrain(); // **IMPORTANTE: Inicializar la estructura de datos**
        this.generateTerrain();
        this.generateMeshes();
    }

    /**
     * Inicializa la matriz 3D 'data' con bloques predeterminados (generalmente aire: id 0).
     */
    initializeTerrain() {
        this.data = []; // Reinicia la data
        for (let x = 0; x < this.size.width; x++) {
            const slice = [];
            for (let y = 0; y < this.size.height; y++) {
                const row = [];
                for (let z = 0; z < this.size.width; z++) { 
                    row.push({
                        id: 0, // 0 = Aire (o bloque transparente/vacío)
                        instanceId: null
                    });
                }
                slice.push(row);
            }
            this.data.push(slice);
        }
    }

    /**
     * Genera el terreno usando ruido de Simplex.
     */
    generateTerrain() {
        // CORREGIDO: El import de SimplexNoise en Three.js ha cambiado.
        // Asegúrate de que el path sea correcto en tu entorno.
        const simplex = new SimplexNoise(); 

        // Los bucles X y Z deben ir juntos para calcular la altura
        for (let x = 0; x < this.size.width; x++) {
            for (let z = 0; z < this.size.width; z++) { // Bucle Z movido aquí

                const value = simplex.noise(
                    x / this.params.terrain.scale,
                    z / this.params.terrain.scale
                );

                // Cálculo de la altura basada en el ruido
                const scaledNoise = this.params.terrain.offset + this.params.terrain.magnitude * value;

                let height = this.size.height * scaledNoise;
                // Ajusta la altura para que esté dentro de los límites [0, this.size.height]
                height = Math.max(0, Math.min(Math.floor(height), this.size.height - 1));

                // Bucle Y: Establece los bloques hasta la altura calculada
                for (let y = 0; y <= height; y++) {
                    // **CORREGIDO: Usar setBlockId para establecer el tipo de bloque (id)**
                    this.setBlockId(x, y, z, 1); // 1 = Bloque de tierra (o el tipo que uses)
                }

            }
        }
    }

    /**
     * Crea la malla instanciada a partir de los datos del terreno.
     */
    generateMeshes() {
        this.clear(); 

        const MaxCount = this.size.width * this.size.width * this.size.height;
        const mesh = new THREE.InstancedMesh(geometry, material, MaxCount);
        mesh.count = 0;

        const matrix = new THREE.Matrix4();
        
        for (let x = 0; x < this.size.width; x++) {
            for (let y = 0; y < this.size.height; y++) {
                for (let z = 0; z < this.size.width; z++) {
                    
                    const block = this.getBlock(x, y, z); 

                    // Solo crear malla si el bloque existe y no es aire (id !== 0)
                    if (block && block.id !== 0) {
                        // Posiciona la caja de 1x1x1. El +0.5 es correcto para centrarla en coordenadas enteras.
                        matrix.setPosition(x + 0.5, y + 0.5, z + 0.5); 
                        
                        // Aplica la matriz
                        mesh.setMatrixAt(mesh.count, matrix);
                        
                        // Guarda el instanceId en los datos del mundo
                        this.setBlockInstanceId(x, y, z, mesh.count); 

                        // Incrementa el contador 
                        mesh.count++;
                    }
                }
            }
        }
        
        // Finaliza y actualiza la matriz de instancias
        mesh.instanceMatrix.needsUpdate = true;
        
        this.add(mesh);
    }
}