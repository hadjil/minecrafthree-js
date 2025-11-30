import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import {World} from './world'
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { createUI } from './ui';

// Asumimos un tamaño de mundo de 8x16x8 para el cálculo del centro
const WORLD_WIDTH = 8;
const WORLD_HEIGHT = 16;
const WORLD_DEPTH = 8;

const CENTER_X = WORLD_WIDTH / 2; // 4
const CENTER_Y = WORLD_HEIGHT / 2; // 8
const CENTER_Z = WORLD_DEPTH / 2; // 4


//Stats
const stats= new Stats();
document.body.append(stats.dom);


///REnder Setup
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth,window.innerHeight);
document.body.appendChild(renderer.domElement);
// Render Color del Cielo
renderer.setClearColor(0x80a0e0);
renderer.shadowMap.enabled=true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap; 


//Camera Setup
const camera = new THREE.PerspectiveCamera(75,window.innerWidth/window.innerHeight, 0.1, 1000);

// 🔥 AJUSTE: Posición de la cámara (la movemos un poco para que tenga una vista general)
camera.position.set(CENTER_X + 15, CENTER_Y + 10, CENTER_Z + 15); 

// 🔥 AJUSTE: La cámara mira al centro geométrico del mundo (4, 8, 4)
camera.lookAt(CENTER_X, CENTER_Y, CENTER_Z); 


//Orbit Controls
const controls=new OrbitControls(camera,renderer.domElement);

// 🔥 AJUSTE: El control de órbita también gira alrededor del centro del mundo
controls.target.set(CENTER_X, CENTER_Y, CENTER_Z); 
controls.update();


//Scene Setup
const scene = new THREE.Scene();
const world =new World();
world.generate();
scene.add(world);

//Render Loop
function animate(){
  requestAnimationFrame(animate);
  stats.update();
  controls.update();

  renderer.render(scene,camera);
  
}



//Añadiendo Luz
function setupLights(){
  // La luz también debe centrarse en el mundo para que las sombras funcionen bien.
  const light1 = new THREE.DirectionalLight(0xFFDB58, 1.5);
  light1.position.set(CENTER_X + 20, CENTER_Y + 30, CENTER_Z + 20); // 24, 38, 24
  light1.target.position.set(CENTER_X, CENTER_Y, CENTER_Z); 
  
  light1.castShadow = true; 
  
  const d = 30; // Aumentamos el volumen de sombra para cubrir el mundo centrado
  light1.shadow.camera.left = -d;
  light1.shadow.camera.right = d;
  light1.shadow.camera.top = d;
  light1.shadow.camera.bottom = -d;
  light1.shadow.camera.near = 1;
  light1.shadow.camera.far = 80; 
  light1.shadow.mapSize.width = 2048; 
  light1.shadow.mapSize.height = 2048;

  scene.add(light1);
  scene.add(light1.target);

  const light2 = new THREE.DirectionalLight(0xFFFFFF, 0.5); 
  light2.position.set(CENTER_X - 10, CENTER_Y + 10, CENTER_Z - 10);
  scene.add(light2);

  const ambient = new THREE.AmbientLight(0xFFFFFF);
  ambient.intensity = 0.3; 
  scene.add(ambient);
}



//Resize
window.addEventListener('resize', () => {
  camera.aspect=window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth,window.innerHeight);

});

setupLights();
createUI(world);
animate();