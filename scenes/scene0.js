import * as THREE from 'three';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.160.1/examples/jsm/controls/OrbitControls.js';

import {createArcAroundAxis3D, addAxes3D, drawParametricCurve3D, drawParametricSurface3D, drawDot3D, drawLine3D, drawVector3D, drawVector2D, drawLine2D, drawDot2D, drawFunction2D,
    makeDraggable, makeDraggableAlongCurve, addLatexLabel, addTextLabel, 
    makeDraggableAcrossSurface, set2DCameraView, worldToScreenPosition, addLatexScreenLabel, insertPicture, drawThickLine3D, addSlider, drawArc,
  drawThickVector3D} from './helperFunctions.js';

const katex = window.katex;
const RED = '#ff0000';
const GREEN = '#00ff00';
const SOFT_RED = '#e57373';     // Coral pink
const SOFT_BLUE = '#64b5f6';    // Sky blue
const SOFT_GREEN = '#81c784';   // Light green
const SOFT_YELLOW = '#fff176';  // Soft yellow
const SOFT_PURPLE = '#b39ddb'; // Soft lavender/lilac tone
const BRIGHT_GREEN = '#39ff14';

const BLACK = '#000000';
const WHITE = '#ffffff';



let resizeListener, resizeObserver, resizeObserver2;
let container, renderer, scene, camera, controls, animationId; 
let renderer2, scene2, camera2, controls2, animationId2;




// Main Functions


async function initLeftMap() {
  setup2DMap(); // sets up scene2, camera2, renderer2, container2

  const container2 = document.getElementById("leftMapContainer");
  await insertPicture(scene2, "./reclamebord_opgave_neg.png", camera2, container2);
}

async function initRightMap() {
  setup2DMapRight(); // sets up scene, camera, renderer, container

  const container = document.getElementById("rightMapContainer");
  await insertPicture(scene, "./reclamebord_opgave_tekst.png", camera, container);
}


async function updateRightMap(){

}

export async function init() {

  await initLeftMap();
  await initRightMap();
  animate();
  animate2();
}



// setup functions for the two windows (left window = 2D, right window = 3D)



function animate() {
  animationId = requestAnimationFrame(animate);
  controls.update();
  updateRightMap();
  renderer.render(scene, camera);
}


function setup2DMapRight(){
  const container= document.getElementById("rightMapContainer");


  renderer = new THREE.WebGLRenderer({ antialias: true ,preserveDrawingBuffer: true});
  renderer.setClearColor(0x000000);
  container.appendChild(renderer.domElement);

  scene = new THREE.Scene();
  scene.background = new THREE.Color("black");

  const aspect = window.innerWidth / window.innerHeight;
  const d = 1; // scale
  camera = new THREE.OrthographicCamera(
    -d * aspect, d * aspect, d, -d, 0.1, 10
   );
  camera.position.set(0, 0, 1);   // Z is up
  camera.lookAt(0, 0, 0);
  scene.add(camera);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableRotate = false;      // disable 3D rotation
  controls.enableZoom = true;         // allow zooming
  controls.enablePan = true;          // allow panning

  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(5, 5, 5);
  scene.add(light);
  scene.add(new THREE.AmbientLight(0xffffff, 0.4));

  const resizeRenderer = () => {
    if (!camera || !renderer) return; // avoid error if already cleaned up

    const { width, height } = container.getBoundingClientRect();
    camera.aspect = width / height;
    const aspect = width / height;
    const d = 1;
    camera.left = -d * aspect;
    camera.right = d * aspect;
    camera.top = d;
    camera.bottom = -d;
    camera.updateProjectionMatrix();

    renderer.setSize(width, height, false);
    renderer.setPixelRatio(window.devicePixelRatio);
  };

  resizeObserver = new ResizeObserver(resizeRenderer);
  resizeObserver.observe(container);
  window.addEventListener('resize', resizeRenderer);

  resizeRenderer();

}


function animate2() {
  animationId2 = requestAnimationFrame(animate2);
  controls2.update();
  renderer2.render(scene2, camera2);
}


function setup2DMap(){
  const container2 = document.getElementById("leftMapContainer");


  renderer2 = new THREE.WebGLRenderer({ antialias: true ,preserveDrawingBuffer: true});
  renderer2.setClearColor(0x000000);
  container2.appendChild(renderer2.domElement);

  scene2 = new THREE.Scene();
  scene2.background = new THREE.Color("black");

  const aspect = window.innerWidth / window.innerHeight;
  const d = 1; // scale
  camera2 = new THREE.OrthographicCamera(
    -d * aspect, d * aspect, d, -d, 0.1, 10
   );
  camera2.position.set(0, 0, 1);   // Z is up
  camera2.lookAt(0, 0, 0);
  scene2.add(camera2);

  controls2 = new OrbitControls(camera2, renderer2.domElement);
  controls2.enableRotate = false;      // disable 3D rotation
  controls2.enableZoom = true;         // allow zooming
  controls2.enablePan = true;          // allow panning

  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(5, 5, 5);
  scene2.add(light);
  scene2.add(new THREE.AmbientLight(0xffffff, 0.4));

  const resizeRenderer2 = () => {
    if (!camera2 || !renderer2) return; // avoid error if already cleaned up

    const { width, height } = container2.getBoundingClientRect();
    camera2.aspect = width / height;
    const aspect = width / height;
    const d = 1;
    camera2.left = -d * aspect;
    camera2.right = d * aspect;
    camera2.top = d;
    camera2.bottom = -d;
    camera2.updateProjectionMatrix();

    renderer2.setSize(width, height, false);
    renderer2.setPixelRatio(window.devicePixelRatio);
  };

  resizeObserver2 = new ResizeObserver(resizeRenderer2);
  resizeObserver2.observe(container2);
  window.addEventListener('resize', resizeRenderer2);

  resizeRenderer2();

}



function cleanup() {


  if (resizeListener) {
  window.removeEventListener('resize', resizeListener);
  resizeListener = null;
  }

  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }
  if (resizeObserver2) {
    resizeObserver2.disconnect();
    resizeObserver2 = null;
  }
  cancelAnimationFrame(animationId);
  cancelAnimationFrame(animationId2);


  renderer.dispose();
  controls.dispose();
  renderer2.dispose();
  controls2.dispose();

  const container = document.getElementById("rightMapContainer");
  if (renderer.domElement && container.contains(renderer.domElement)) {
    container.removeChild(renderer.domElement);
  }

  const container2 = document.getElementById("leftMapContainer");
  if (renderer2.domElement && container2.contains(renderer2.domElement)) {
    container2.removeChild(renderer2.domElement);
  }
  scene = camera = renderer  = controls = null;
  scene2 = camera2 = renderer2  = controls2 = null;



}

export default { init, cleanup };
