import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import {World} from './world'
import Stats from 'three/examples/jsm/libs/stats.module.js';

//Stats
const stats= new Stats();
document.body.append(stats.dom);


///REnder Setup
const renderer = new THREE.WebGLRenderer();
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth,window.innerHeight);
document.body.appendChild(renderer.domElement);
// Render Color del Cielo
renderer.setClearColor(0x80a0e0);


//Camera Setup
const camera = new THREE.PerspectiveCamera(75,window.innerWidth/window.innerHeight);
camera.position.set(-24,16,-24);
camera.lookAt(0,0,0);

//Orbit Controls
const controls=new OrbitControls(camera,renderer.domElement);
controls.target.set(0,0,0);
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

  renderer.render(scene,camera);
  
}



//Añadiendo Luz
function setupLights(){
  const light1= new THREE.DirectionalLight(0xFFDB58, 1);
  light1.position.set(1,1,1);
  scene.add(light1);

  const light2= new THREE.DirectionalLight(0xFFFFFF, 2);
  light2.position.set(-1,1,-0.5);
  scene.add(light2);

  const ambient= new THREE.AmbientLight();
  ambient.intensity=0.1;
  scene.add(ambient);
}



//Resize
window.addEventListener('resize', () => {
  camera.aspect=window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth,window.innerHeight);

});

setupLights();

animate();