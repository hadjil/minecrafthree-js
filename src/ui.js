import {GUI} from 'three/addons/libs/lil-gui.module.min.js';
import { blocks } from './blocks';
/**
 * Crea la interfaz de usuario para controlar los parámetros del mundo en tiempo real.
 * @param {World} world - La instancia de la clase World que contiene los métodos generate, initializeTerrain, etc.
 */
export function createUI(world){
    const gui = new GUI();

    // 🔄 Función de Enlace: Llama a world.generate() cada vez que un parámetro cambia.
    const updateWorld = () => {
        // Asegúrate de que esta función está definida correctamente.
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
                 .onChange(updateWorld); // <-- ¡Correcto!
                 
    terrainFolder.add(world.params.terrain, 'magnitude', 0, 1)
                 .name('Magnitud')
                 .onChange(updateWorld); // <-- ¡Correcto!
                 
    terrainFolder.add(world.params.terrain, 'offset', 0, 1)
                 .name('Offset')
                 .onChange(updateWorld); // <-- ¡Correcto!
                 
    // ⭐ Nota: Asegúrate de que tu clase World maneje 'seed' correctamente.
    // Si 'seed' se usa en el constructor del SimplexNoise, necesitarás regenerar el objeto SimplexNoise.
    terrainFolder.add(world.params.terrain, 'seed', 0, 300)
                 .name('Seed')
                 .onChange(updateWorld); // <-- ¡Correcto!


    // 💎 Controles de Recursos - ¡AQUÍ ESTÁ EL CAMBIO!
    const resourcesFolder = gui.addFolder('Resources');
    
    // El control 'scarcity' ya lo tenías bien.
    resourcesFolder.add(blocks.stone,'scarcity',0,1)
                   .name('Scarcity')
                   .onChange(updateWorld); // <-- ¡Añadido/Mantenido!

    const scaleFolder = resourcesFolder.addFolder('Scale');
    
    // **Debes añadir .onChange(updateWorld) a cada propiedad de scale.**
    scaleFolder.add(blocks.stone.scale,'x',10,100)
               .name('Escala en X')
               .onChange(updateWorld); // <-- ¡Añadido!
               
    scaleFolder.add(blocks.stone.scale,'y',10,100)
               .name('Escala en Y')
               .onChange(updateWorld); // <-- ¡Añadido!
               
    scaleFolder.add(blocks.stone.scale,'z',10,100)
               .name('Escala en Z')
               .onChange(updateWorld); // <-- ¡Añadido!

    // 💡 Ejecución Inicial: Generamos el mundo una vez al inicio para que el estado inicial de la GUI coincida con el mundo.
    // Si el mundo ya se genera en otro lugar (ej. al instanciarlo), puedes omitir esta línea.
    world.generate();
}