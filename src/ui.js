import {GUI} from 'three/addons/libs/lil-gui.module.min.js';

/**
 * Crea la interfaz de usuario para controlar los parámetros del mundo en tiempo real.
 * @param {World} world - La instancia de la clase World que contiene los métodos generate, initializeTerrain, etc.
 */
export function createUI(world){
    const gui = new GUI();

    // 🔄 Función de Enlace: Llama a world.generate() cada vez que un parámetro cambia.
    const updateWorld = () => {
        world.generate();
    };

    // 📐 Controles de Dimensión (size)
    // El .onChange(updateWorld) hace que el mundo se regenere al arrastrar el slider.
    gui.add(world.size, 'width', 8, 100, 1)
       .name('Anchura')
       .onChange(updateWorld);
       
    gui.add(world.size, 'height', 8, 60, 1)
       .name('Altura')
       .onChange(updateWorld);

    // ⛰️ Controles de Terreno
    const terrainFolder = gui.addFolder('Terrain');
    
    terrainFolder.add(world.params.terrain, 'scale', 10, 100)
                 .name('Escala')
                 .onChange(updateWorld);
                 
    terrainFolder.add(world.params.terrain, 'magnitude', 0, 1)
                 .name('Magnitud')
                 .onChange(updateWorld);
                 
    terrainFolder.add(world.params.terrain, 'offset', 0, 1)
                 .name('Offset')
                 .onChange(updateWorld);
                 
    // ⭐ Nota: Asegúrate de que tu clase World maneje 'seed' correctamente.
    // Si 'seed' se usa en el constructor del SimplexNoise, necesitarás regenerar el objeto SimplexNoise.
    terrainFolder.add(world.params.terrain, 'seed', 0, 300)
                 .name('Seed')
                 .onChange(updateWorld);

    // ❌ Eliminado: Se ha quitado la línea gui.add(world, 'generate');
    
    // 💡 Ejecución Inicial: Generamos el mundo una vez al inicio para que el estado inicial de la GUI coincida con el mundo.
    // Si el mundo ya se genera en otro lugar (ej. al instanciarlo), puedes omitir esta línea.
    world.generate();
}