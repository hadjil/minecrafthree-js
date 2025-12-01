import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { World } from './world'
import Stats from 'three/examples/jsm/libs/stats.module.js';
// ❌ ELIMINADO: import { PointerLockControls } from "three/addons/controls/PointerLockControls.js"; 
import { createUI } from './ui.js'; 

// Asumimos un tamaño de mundo de 8x16x8 para el cálculo del centro
const WORLD_WIDTH = 8;
const WORLD_HEIGHT = 16;
const WORLD_DEPTH = 8;

const CENTER_X = WORLD_WIDTH / 2; // 4
const CENTER_Y = WORLD_HEIGHT / 2; // 8
const CENTER_Z = WORLD_DEPTH / 2; // 4

const SKY_COLOR = 0x80a0e0; 

//Stats
const stats= new Stats();
document.body.append(stats.dom);


/// Render Setup
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth,window.innerHeight);
document.body.appendChild(renderer.domElement);
renderer.setClearColor(SKY_COLOR); 
renderer.shadowMap.enabled=true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap; 


//Camera Setup
// Posición inicial más elevada para la vista cenital
const camera = new THREE.PerspectiveCamera(75,window.innerWidth/window.innerHeight, 0.1, 1000);
camera.position.set(CENTER_X + 25, CENTER_Y + 30, CENTER_Z + 25); 
camera.lookAt(CENTER_X, CENTER_Y, CENTER_Z); 


// ✅ Orbit Controls: Únicos controles
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(CENTER_X, CENTER_Y, CENTER_Z); 
controls.update();


//Scene Setup
const scene = new THREE.Scene();

const FOG_DENSITY = 0.015; 
scene.fog = new THREE.FogExp2(SKY_COLOR, FOG_DENSITY); 

scene.add(camera);

const world = new World();
world.generate();
scene.add(world);


// 🚀 TIEMPO: Necesario para calcular el delta
let prevTime = performance.now();


// --- FUNCIÓN DE UTILIDAD MÓVIL ---
function isMobile() {
    return /Mobi|Android/i.test(navigator.userAgent);
}


//Render Loop
function animate(){
    requestAnimationFrame(animate);

    stats.update();
    
    // 🚀 Solo actualizar los OrbitControls
    controls.update(); 
    renderer.render(scene, camera); 
}


//---

function setupLights(){
    // ... (configuración de luces) ...
    const light1 = new THREE.DirectionalLight(0xFFE5B4, 1.5); 
    light1.position.set(CENTER_X + 20, CENTER_Y + 30, CENTER_Z + 20); 
    light1.target.position.set(CENTER_X, CENTER_Y, CENTER_Z); 
    light1.castShadow = true; 
    const d = 15; 
    light1.shadow.camera.left = -d;
    light1.shadow.camera.right = d;
    light1.shadow.camera.top = d;
    light1.shadow.camera.bottom = -d;
    light1.shadow.camera.near = 1;
    light1.shadow.camera.far = 40; 
    light1.shadow.mapSize.width = 512; 
    light1.shadow.mapSize.height = 512;
    scene.add(light1);
    scene.add(light1.target);

    const hemisphereLight = new THREE.HemisphereLight(0x87CEEB, 0x5C4033, 0.8); 
    scene.add(hemisphereLight);
    
    const pointLight = new THREE.PointLight(0xffffff, 50, 50); 
    pointLight.position.set(CENTER_X + 5, CENTER_Y + 15, CENTER_Z - 5); 
    scene.add(pointLight);
}


//---

//Resize
window.addEventListener('resize', () => {
  camera.aspect=window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth,window.innerHeight);
});


setupLights();


// 🚨 Pasamos 'null' o un objeto vacío como 'player' ya que ya no tiene lógica de movimiento
createUI(world, scene, null); 
animate();