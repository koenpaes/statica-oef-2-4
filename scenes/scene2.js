import * as THREE from 'three';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.160.1/examples/jsm/controls/OrbitControls.js';

import {createArcAroundAxis3D, addAxes3D, drawParametricCurve3D, drawParametricSurface3D, drawDot3D, drawLine3D, drawVector3D, drawVector2D, drawLine2D, drawDot2D, drawFunction2D,
    makeDraggable, makeDraggableAlongCurve, addLatexLabel, addTextLabel, 
    makeDraggableAcrossSurface, set2DCameraView, worldToScreenPosition, addLatexScreenLabel, insertPicture, drawThickLine3D, addSlider, drawArc,
    drawThickVector3D} from './helperFunctions.js';

const katex = window.katex;
const RED = '#ff0000';
const GREEN = '#00ff00';
const BLUE = '#0000ff';
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
let alphaSlider;

let alpha = Math.PI/6;
let pointA, pointB, pointLeftWall, pointRightWall, point1, point2, leftRope, rightRope, lineAB, line1, line2, alphaArc, thetaArc, alphaArc2, thetaArc2;
let endpointK, endpointKyz, endpointKx, endpointKy, endpointKz, dir, vectorK, vectorKx, vectorKyz, vectorKy, vectorKz;
let labelA, labelB, labelAlpha, labelTheta, labelE, labelAlpha2, labelTheta2;
let dotLine1, dotLine2, dotLine3, dotLine4;
let xLine, yLine, zLine;
let xAs, yAs, zAs, labelX, labelY, labelZ;



// Main Functions



async function initLeftMap() {
  setup2DMap(); // sets up scene2, camera2, renderer2, container2

  const container2 = document.getElementById("leftMapContainer");
  await insertPicture(scene2, "./reclamebord_opgave_neg.png", camera2, container2);
}

async function initRightMap() {
  setup3DMap();

  //coordinate axes
  xAs = drawThickVector3D(scene,-6,4.5,0,-4,4.5,0);
  yAs = drawThickVector3D(scene,-6,4.5,0,-6,4.5,2);
  zAs = drawThickVector3D(scene,-6,4.5,0,-6,2.5,0);

  //slider
  alphaSlider = addSlider(30, 0, 90, {
  map: 'rightMap',
  offsetX: 30,
  offsetY: 30,
  step: 0.01,
  label: '\\alpha \\: (^\\circ)',
  isLatex:true
  });

  //surface
  const surface = drawParametricSurface3D(scene,"-6","u","v","u","v",-0.5,4.5,0,11,{color:SOFT_BLUE, opacity:0.5});
  const surface2 = drawParametricSurface3D(scene,"6","u","v","u","v",-0.5,4.5,0,11,{color:SOFT_BLUE, opacity:0.5});
  const surface3 = drawParametricSurface3D(scene,"v","u","0","u","v",-0.5,4.5,-6,6,{color:SOFT_BLUE, opacity:0.5});

  //Points
  pointLeftWall = drawDot3D(scene,-6,0,10,0.1,SOFT_GREEN);
  pointRightWall = drawDot3D(scene,6,0,10,0.1,SOFT_GREEN);
  point1 = drawDot3D(scene,-6,0,6,0.01,WHITE);

  pointA = drawDot3D(scene,-2,4*Math.sin(alpha),10-4*Math.cos(alpha),0.1,WHITE);
  pointB = drawDot3D(scene,2,4*Math.sin(alpha),10-4*Math.cos(alpha),0.1,WHITE);
  point2 = drawDot3D(scene,-6,4*Math.sin(alpha),10-4*Math.cos(alpha),0.01,SOFT_GREEN);

  dir = new THREE.Vector3(-Math.cos(Math.PI/4), -Math.sin(Math.PI/4)*Math.sin(alpha),Math.sin(Math.PI/4)*Math.cos(alpha));
  endpointK = drawDot3D(scene,-2+3*dir.x,4*Math.sin(alpha)+3*dir.y,10-4*Math.cos(alpha)+3*dir.z,0.01,WHITE);
  endpointKyz = drawDot3D(scene,-2,4*Math.sin(alpha)+3*dir.y,10-4*Math.cos(alpha)+3*dir.z,0.01,WHITE);
  endpointKx = drawDot3D(scene,-2+3*dir.x,4*Math.sin(alpha),10-4*Math.cos(alpha),0.01,WHITE);
  endpointKy = drawDot3D(scene,-2,4*Math.sin(alpha)+3*dir.y,10-4*Math.cos(alpha),0.01,WHITE);
  endpointKz = drawDot3D(scene,-2,4*Math.sin(alpha),10-4*Math.cos(alpha)+3*dir.z,0.01,WHITE);

  //Lines
  dotLine1 = drawLine3D(scene, endpointK, endpointKyz,{dashed:true});
  dotLine2 = drawLine3D(scene, endpointK, endpointKx,{dashed:true});
  dotLine3 = drawLine3D(scene, endpointKy, endpointKyz,{dashed:true});
  dotLine4 = drawLine3D(scene, endpointKz, endpointKyz,{dashed:true});

  xLine = drawThickLine3D(scene, pointA, endpointKx,{color: SOFT_PURPLE, radius:0.03});
  yLine = drawThickLine3D(scene, pointA, endpointKy,{color: SOFT_PURPLE, radius:0.03});
  zLine = drawThickLine3D(scene, pointA, endpointKz,{color: SOFT_PURPLE, radius:0.03});

  leftRope = drawThickLine3D(scene,pointLeftWall,pointA,{color:SOFT_GREEN, radius:0.01} );
  rightRope = drawThickLine3D(scene,pointRightWall,pointB,{color:SOFT_GREEN, radius:0.02} );
  lineAB =   drawThickLine3D(scene,pointA,pointB,{color:WHITE, radius:0.05} );
  line1 =   drawThickLine3D(scene,pointLeftWall,point1,{color:WHITE, radius:0.015} );
  line2 =   drawThickLine3D(scene,pointLeftWall,point2,{color:BRIGHT_GREEN, radius:0.02} );

  //Vectors
  vectorK = drawThickVector3D(scene,pointA,endpointK,{color:SOFT_BLUE, radius:0.05});
  vectorKyz = drawThickLine3D(scene,pointA,endpointKyz,{color:SOFT_YELLOW, radius:0.03, headRadius: 0.08});

  //arcs
  alphaArc = drawArc(scene,new THREE.Vector3(1,0,0),new THREE.Vector3(-6,0,10),new THREE.Vector3(-6,0,8),alpha);
  alphaArc2 = drawArc(scene,new THREE.Vector3(1,0,0),new THREE.Vector3(-2,4*Math.sin(alpha),10-4*Math.cos(alpha)),new THREE.Vector3(-2,4*Math.sin(alpha),10-4*Math.cos(alpha)+1.3*dir.z),alpha);

  thetaArc = drawArc(scene,new THREE.Vector3(0,-Math.cos(alpha),-Math.sin(alpha)),new THREE.Vector3(-6,0,10),new THREE.Vector3(-6,1.5*Math.sin(alpha),10-1.5*Math.cos(alpha)),Math.PI/4,{color:BRIGHT_GREEN});
  thetaArc2 = drawArc(scene,new THREE.Vector3(0,-Math.cos(alpha),-Math.sin(alpha)),new THREE.Vector3(-2,4*Math.sin(alpha),10-4*Math.cos(alpha)),new THREE.Vector3(-2,4*Math.sin(alpha)+1.5*dir.y,10-4*Math.cos(alpha)+1.5*dir.z),Math.PI/4,{color:BRIGHT_GREEN});

  // labels
  labelX = addLatexLabel(scene,`x`,-4,4.5,0.5,{size:5, color:WHITE});
  labelY = addLatexLabel(scene,`y`,-5.5,4.5,2,{size:5, color:WHITE});
  labelZ = addLatexLabel(scene,`z`,-5.5,2.5,0.5,{size:5, color:WHITE});

  labelA = await addLatexLabel(scene,`A`,-1.7,0.3+4*Math.sin(alpha),10-4*Math.cos(alpha),{size:4, color:WHITE});
  labelB = await addLatexLabel(scene,`B`,2.3,0.3+4*Math.sin(alpha),10-4*Math.cos(alpha),{size:4, color:WHITE});
  labelTheta = await addLatexLabel(scene,`\\theta`,-5.3,1.7*Math.sin(alpha),10-1.7*Math.cos(alpha),{size:4, color:SOFT_GREEN});
  labelAlpha = await addLatexLabel(scene,`\\alpha`,-5.8,2.3*Math.sin(alpha/2),10-2.3*Math.cos(alpha/2),{size:4, color:WHITE});
  labelE = await addLatexLabel(scene,`\\vec{e}_K`,-2+3.3*dir.x,4*Math.sin(alpha)+3.3*dir.y,10-4*Math.cos(alpha)+3.3*dir.z,{size:4, color:SOFT_BLUE});
  labelAlpha2 = await addLatexLabel(scene,`\\alpha`,-2,4*Math.sin(alpha)-1.6*dir.z*Math.sin(alpha/2),10-4*Math.cos(alpha)+1.6*dir.z*Math.cos(alpha/2),{size:4, color:WHITE});
  labelTheta2 = await addLatexLabel(scene,`\\theta`,-2.5,4*Math.sin(alpha)+1.5*dir.y,10-4*Math.cos(alpha)+1.5*dir.z+0.1,{size:4, color:SOFT_GREEN});


 

}

async function updateRightMap(){
  alpha = alphaSlider.getValue()/180*Math.PI;
  pointA.update(-2, 4*Math.sin(alpha), 10-4*Math.cos(alpha));
  pointB.update( 2, 4*Math.sin(alpha), 10-4*Math.cos(alpha));
  point2.update(-6, 4*Math.sin(alpha), 10-4*Math.cos(alpha));
  dir.set(-Math.cos(Math.PI/4), -Math.sin(Math.PI/4)*Math.sin(alpha),Math.sin(Math.PI/4)*Math.cos(alpha));
  endpointK.update(-2+3*dir.x,4*Math.sin(alpha)+3*dir.y,10-4*Math.cos(alpha)+3*dir.z);
  endpointKyz.update(-2,4*Math.sin(alpha)+3*dir.y,10-4*Math.cos(alpha)+3*dir.z);
  endpointKx.update(-2+3*dir.x,4*Math.sin(alpha),10-4*Math.cos(alpha));
  endpointKy.update(-2,4*Math.sin(alpha)+3*dir.y,10-4*Math.cos(alpha));
  endpointKz.update(-2,4*Math.sin(alpha),10-4*Math.cos(alpha)+3*dir.z);

  dotLine1.update(endpointK,endpointKyz);
  dotLine2.update(endpointK, endpointKx);
  dotLine3.update(endpointKy, endpointKyz);
  dotLine4.update(endpointKz, endpointKyz);
  xLine.update(pointA, endpointKx);
  yLine.update(pointA, endpointKy);
  zLine.update(pointA, endpointKz);

  leftRope.update(pointLeftWall, pointA);
  rightRope.update(pointRightWall, pointB);
  lineAB.update(pointA, pointB);
  line2.update(pointLeftWall, point2);
  
  vectorK.update(pointA, endpointK);
  vectorKyz.update(pointA, endpointKyz);
  
  alphaArc.delete();
  alphaArc = drawArc(scene,new THREE.Vector3(1,0,0),new THREE.Vector3(-6,0,10),new THREE.Vector3(-6,0,8),alpha,2);
  alphaArc2.delete();
  alphaArc2 = drawArc(scene,new THREE.Vector3(1,0,0),new THREE.Vector3(-2,4*Math.sin(alpha),10-4*Math.cos(alpha)),new THREE.Vector3(-2,4*Math.sin(alpha),10-4*Math.cos(alpha)+1.3*dir.z),alpha);

  thetaArc.delete();
  thetaArc = drawArc(scene,new THREE.Vector3(0,-Math.cos(alpha),-Math.sin(alpha)),new THREE.Vector3(-6,0,10),new THREE.Vector3(-6,1.5*Math.sin(alpha),10-1.5*Math.cos(alpha)),Math.PI/4,{color:BRIGHT_GREEN});
  thetaArc2.delete();
  thetaArc2 = drawArc(scene,new THREE.Vector3(0,-Math.cos(alpha),-Math.sin(alpha)),new THREE.Vector3(-2,4*Math.sin(alpha),10-4*Math.cos(alpha)),new THREE.Vector3(-2,4*Math.sin(alpha)+1.5*dir.y,10-4*Math.cos(alpha)+1.5*dir.z),Math.PI/4,{color:BRIGHT_GREEN});

  
  labelA.update({y:0.3+4*Math.sin(alpha), z:10-4*Math.cos(alpha)});
  labelB.update({y:0.3+4*Math.sin(alpha), z:10-4*Math.cos(alpha)});
  labelTheta.update({y:1.7*Math.sin(alpha), z:10-1.7*Math.cos(alpha)});
  let sizeAlpha = 4;
  if (alpha < 0.1){sizeAlpha = 0};
  labelAlpha.update({y:2.3*Math.sin(alpha/2), z:10-2.3*Math.cos(alpha/2), size:sizeAlpha});
  labelE.update({x:-2+3.3*dir.x,y:4*Math.sin(alpha)+3.3*dir.y,z:10-4*Math.cos(alpha)+3.3*dir.z});
  labelAlpha2.update({x:-2,y:4*Math.sin(alpha)-1.6*dir.z*Math.sin(alpha/2),z:10-4*Math.cos(alpha)+1.6*dir.z*Math.cos(alpha/2), size:sizeAlpha});
  labelTheta2.update({x:-2.5,y:4*Math.sin(alpha)+1.5*dir.y,z:10-4*Math.cos(alpha)+1.5*dir.z+0.1});



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

function setup3DMap(){
  container = document.getElementById("rightMapContainer");


  renderer = new THREE.WebGLRenderer({ antialias: true,preserveDrawingBuffer: true });
  renderer.setClearColor(0x000000);
  container.appendChild(renderer.domElement);


  scene = new THREE.Scene();
  scene.background = new THREE.Color("black");

  camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
  camera.position.set(6, -8, 12);
  camera.lookAt(-2,4*Math.sin(alpha),10-4*Math.cos(alpha));
  camera.up.set(0, 0, 1); // 👈 This tells OrbitControls that Z is the up direction
  scene.add(camera);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.screenSpacePanning = false;
  controls.target.set(-2,4*Math.sin(alpha),10-4*Math.cos(alpha)); // THIS is the real “look at” point for OrbitControls
  controls.update();

  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(0, -5, 5);
  scene.add(light);
  scene.add(new THREE.AmbientLight(0xffffff, 0.4));

  const resizeRenderer = () => {
    if (!camera || !renderer) return; // avoid error if already cleaned up

    const { width, height } = container.getBoundingClientRect();
    camera.aspect = width / height;
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


  renderer2 = new THREE.WebGLRenderer({ antialias: true,preserveDrawingBuffer: true });
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
   if (alphaArc) {
  alphaArc.delete();
  alphaArc = null;
}

if (thetaArc) {
  thetaArc.delete();
  thetaArc = null;
}
if (alphaArc2) {
  alphaArc2.delete();
  alphaArc2 = null;
}

if (thetaArc2) {
  thetaArc2.delete();
  thetaArc2 = null;
}


   

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

  alphaSlider.remove();

}

export default { init, cleanup };
