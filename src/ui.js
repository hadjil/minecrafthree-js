import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { blocks } from './blocks';

// Nota: Esta constante se mantiene pero no se usará ya que 'player' será null en main.js
const MOBILE_JUMP_VELOCITY = 0.25;

/**
 * Crea la interfaz de usuario para controlar los parámetros del mundo en tiempo real e implementa los botones de movimiento móvil.
 * @param {World} world - La instancia de la clase World.
 * @param {THREE.Scene} scene - La instancia de la escena de Three.js.
 * @param {Object|null} player - El objeto del jugador (será null en modo cenital).
 */
export function createUI(world, scene, player){
    const gui = new GUI();

    // Función simple para detectar si es un dispositivo móvil.
    function isMobile() {
        return /Mobi|Android/i.test(navigator.userAgent);
    }

    /**
     * Crea y gestiona los botones de movimiento en la pantalla.
     * @param {Object} playerObject - El objeto del jugador.
     */
    function setupMobileButtons(playerObject) {
        
        // --- CSS Base del Botón ---
        const buttonStyle = `
            position: fixed; 
            width: 60px; 
            height: 60px; 
            background: rgba(0, 0, 0, 0.5); 
            color: white; 
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: 5px; 
            font-size: 24px; 
            text-align: center; 
            line-height: 60px; 
            user-select: none;
            z-index: 1000;
            touch-action: manipulation;
        `;

        // 🗺️ Mapeo de botones a estados de movimiento (moveState)
        const buttonMap = {
            'forward': { key: 'KeyW', text: '⬆️', pos: { left: '8%', bottom: '110px' } },
            'backward': { key: 'KeyS', text: '⬇️', pos: { left: '8%', bottom: '30px' } },
            'left': { key: 'KeyA', text: '⬅️', pos: { left: '1%', bottom: '70px' } },
            'right': { key: 'KeyD', text: '➡️', pos: { left: '15%', bottom: '70px' } },
            'jump': { key: 'Space', text: 'JUMP', pos: { right: '5%', bottom: '50px', width: '90px' } }
        };
        
        // Función para manipular el moveState del jugador
        const toggleMove = (key, isDown) => {
            switch(key) {
                // Estas líneas se ejecutarían solo si playerObject fuera un objeto válido
                case 'KeyW': playerObject.moveState.forward = isDown; break;
                case 'KeyS': playerObject.moveState.backward = isDown; break;
                case 'KeyA': playerObject.moveState.left = isDown; break;
                case 'KeyD': playerObject.moveState.right = isDown; break;
                case 'Space': 
                    if (isDown) { 
                        if (playerObject.isOnGround) {
                            playerObject.velocity.y = MOBILE_JUMP_VELOCITY; 
                            playerObject.isOnGround = false;
                        }
                    }
                    break;
            }
        };

        // Crear y añadir cada botón
        for (const id in buttonMap) {
            const data = buttonMap[id];
            const button = document.createElement('div');
            button.style.cssText = buttonStyle;
            button.style.left = data.pos.left || 'auto';
            button.style.right = data.pos.right || 'auto';
            button.style.bottom = data.pos.bottom;
            button.style.width = data.pos.width || '60px';
            button.style.lineHeight = data.pos.lineHeight || '60px';
            button.innerHTML = data.text;
            
            // Manejadores de eventos táctiles
            button.addEventListener('touchstart', (e) => {
                e.preventDefault(); 
                e.stopPropagation();
                button.style.background = 'rgba(0, 0, 0, 0.8)';
                toggleMove(data.key, true);
            });

            button.addEventListener('touchend', (e) => {
                e.preventDefault(); 
                e.stopPropagation();
                button.style.background = 'rgba(0, 0, 0, 0.5)';
                if (data.key !== 'Space') {
                    toggleMove(data.key, false);
                }
            });

            document.body.appendChild(button);
        }
    }

    // 🔄 Funciones de Enlace
    const updateWorld = () => { world.generate(); };
    const updateScene = () => { /* Sin acción */ };

    // --- Controles de lil-gui (COMPLETOS) ---

    // 📐 Controles de Dimensión
    gui.add(world.size, 'width', 8, 100, 1).name('Anchura').onChange(updateWorld);
    gui.add(world.size, 'height', 8, 60, 1).name('Altura').onChange(updateWorld);

    // ⛰️ Controles de Terreno
    const terrainFolder = gui.addFolder('Terrain');
    terrainFolder.add(world.params.terrain, 'scale', 10, 100).name('Escala').onChange(updateWorld);
    terrainFolder.add(world.params.terrain, 'magnitude', 0, 1).name('Magnitud').onChange(updateWorld);
    terrainFolder.add(world.params.terrain, 'offset', 0, 1).name('Offset').onChange(updateWorld);
    terrainFolder.add(world.params.terrain, 'seed', 0, 300).name('Seed').onChange(updateWorld);

    // 💎 Controles de Recursos
    const resourcesFolder = gui.addFolder('Resources');
    resourcesFolder.add(blocks.stone,'scarcity',0,1).name('Scarcity').onChange(updateWorld);

    const scaleFolder = resourcesFolder.addFolder('Scale');
    scaleFolder.add(blocks.stone.scale,'x',10,100).name('Escala en X').onChange(updateWorld);
    scaleFolder.add(blocks.stone.scale,'y',10,100).name('Escala en Y').onChange(updateWorld);
    scaleFolder.add(blocks.stone.scale,'z',10,100).name('Escala en Z').onChange(updateWorld);

    // 🌫️ Controles de Niebla (FOG)
    if (scene.fog) { 
        const fogFolder = gui.addFolder('Atmósfera / Niebla');
        fogFolder.add(scene.fog, 'density', 0.001, 0.1, 0.001).name('Densidad').onChange(updateScene);
        fogFolder.addColor(scene.fog, 'color').name('Color de Niebla').onChange(updateScene);
        fogFolder.open();
    }
    
    // 🕹️ IMPLEMENTACIÓN DE BOTONES VIRTUALES 
    // ESTO SERÁ FALSO porque 'player' ahora es null en main.js
    if (player && isMobile()) {
        setupMobileButtons(player); 
        gui.hide(); 
    }

    // 💡 Ejecución Inicial:
    world.generate();
}