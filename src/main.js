import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

///REnder Setup
const renderer = new THREE.WebGLRenderer();
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth,window.innerHeight);
document.body.appendChild(renderer.domElement);
// Render Color del Cielo
renderer.setClearColor(0x80a0e0);


//Camera Setup
const camera = new THREE.PerspectiveCamera(75,window.innerWidth/window.innerHeight);
camera.position.set(-32,16,-32);
camera.lookAt(0,0,0);

//Orbit Controls
const controls=new OrbitControls(camera,renderer.domElement);
controls.target.set(16,0,16);
controls.update();






//Scene Setup
const scene = new THREE.Scene();
const geometry=new THREE.BoxGeometry();
const material = new THREE.MeshLambertMaterial({color: 0x7FFFD4})


//Render Loop
function animate(){
  requestAnimationFrame(animate);

  renderer.render(scene,camera);
}
//Crea un suelo
function setupWorld(size){
  for(let x=0; x< size; x++){
      for(let z=0; z< size; z++){
        const cube = new THREE.Mesh(geometry,material);
        cube.position.set(x,0,z);
        scene.add(cube)

      }
  }
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
setupWorld(30);
animate();