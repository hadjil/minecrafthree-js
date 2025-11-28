import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

///REnder Setup
const renderer = new THREE.WebGLRenderer();
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth,window.innerHeight);
document.body.appendChild(renderer.domElement);


//Camera Setup
const camera = new THREE.PerspectiveCamera(75,window.innerWidth/window.innerHeight);
camera.position.set(2,2,2);
camera.lookAt(0,0,0);

//Orbit Controls
const controls=new OrbitControls(camera,renderer.domElement);








//Scene Setup
const scene = new THREE.Scene();
const geometry=new THREE.BoxGeometry();
const material = new THREE.MeshBasicMaterial({color: 0x7FFFD4})
const cube = new THREE.Mesh(geometry,material);
scene.add(cube)

//Render Loop
function animate(){
  requestAnimationFrame(animate);

  renderer.render(scene,camera);
}

//Resize
window.addEventListener('resize', () => {
  camera.aspect=window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth,window.innerHeight);

});


animate();