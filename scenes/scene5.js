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

let alpha = 24*Math.PI/180;
let beta = 30.7*Math.PI/180;
let G = 1800;
let K = 1393;
let W = 800;
let scaleF = 348;
let pointA, pointB, pointLeftWall, pointRightWall, point1, point2, leftRope, rightRope, lineAB, line1, line2, alphaArc, thetaArc, alphaArc2, thetaArc2;
let endpointK, endpointKyz, endpointKx, endpointKy, endpointKz, vectorK, vectorKx, vectorKyz, vectorKy, vectorKz;
let labelA, labelB, labelAlpha, labelTheta, labelK, labelK2, labelG, labelW, labelAlpha2, labelTheta2, labelEx, labelEy, labelEz, labelKyz;
let dotLine1, dotLine2, dotLine3, dotLine4;
let xLine, yLine, zLine;
let xAs, yAs, zAs, labelX, labelY, labelZ;
let pointC, pointD, pointG, pointW, lineBC, lineCD, lineAD, endpointW, endpointG, vectorW, vectorG, vectorK2, endpointK2;
let cloth;

let ALeft,CLeft, OLeft, ULeft, GLeft, WLeft,endpointGLeft, endpointWLeft, endpointKyzLeft, pointLeft2;
let lineLeft1, lineLeftAC, lineLeft2, lineLeft3;
let vectorKyzLeft, vectorGLeft, vectorWLeft, alphaArcLeft, betaArcLeft;
let labelAlphaLeft, labelBetaLeft, labelGLeft, labelWLeft, labelKLeft, labelVLDLeft, labelALeft;

// Main Functions

let  dir = new THREE.Vector3(-Math.cos(Math.PI/4), -Math.sin(Math.PI/4)*Math.sin(alpha),Math.sin(Math.PI/4)*Math.cos(alpha));



async function initLeftMap() {
  setup2DMap(); // sets up scene2, camera2, renderer2, container2
  set2DCameraView(controls2, camera2, 4*Math.sin(alpha),10-4*Math.cos(alpha),0.15);

  
  //points
  OLeft = drawDot3D(scene2,0,0,0,0.01, WHITE);
  ULeft = drawDot3D(scene2,0,10,0,0.001,WHITE);
  ALeft = drawDot3D(scene2,4*Math.sin(alpha),10-4*Math.cos(alpha),0,0.1,SOFT_RED);
  CLeft = drawDot3D(scene2,4*Math.sin(alpha)+2*Math.sin(beta),10-4*Math.cos(alpha)-2*Math.cos(beta),0,0.1,SOFT_RED);
  pointLeft2 = drawDot3D(scene2,4*Math.sin(alpha),10-4*Math.cos(alpha)-2*Math.cos(beta),0,0.01,WHITE);
  GLeft = drawDot3D(scene2,4*Math.sin(alpha)+Math.sin(beta),10-4*Math.cos(alpha)-Math.cos(beta),0,0.1,SOFT_RED);
  WLeft = drawDot3D(scene2,4*Math.sin(alpha)+1.333*Math.sin(beta),10-4*Math.cos(alpha)-1.333*Math.cos(beta),0,0.1,SOFT_PURPLE);
  endpointWLeft = drawDot3D(scene2,4*Math.sin(alpha)+1.333*Math.sin(beta)+W/scaleF,10-4*Math.cos(alpha)-1.333*Math.cos(beta),0,0.01,SOFT_PURPLE);
  endpointGLeft = drawDot3D(scene2,4*Math.sin(alpha)+Math.sin(beta),10-4*Math.cos(alpha)-Math.cos(beta)-G/scaleF,0,0.01,SOFT_RED);
  endpointKyzLeft = drawDot3D(scene2,4*Math.sin(alpha)+K/scaleF*dir.y,10-4*Math.cos(alpha)+K/scaleF*dir.z,0,0.01,WHITE);


  //lines
  lineLeft1 = drawLine3D(scene2,OLeft, ULeft,{dashed:true});
  lineLeft2 = drawLine3D(scene2,ALeft, ULeft,{dashed:true});  
  lineLeft3 = drawLine3D(scene2,ALeft, pointLeft2,{dashed:true});

  lineLeftAC = drawThickLine3D(scene2,ALeft, CLeft,{radius: 0.07,color:SOFT_RED});

  //Vectors
  vectorKyzLeft = drawThickVector3D(scene2,ALeft,endpointKyzLeft,{color:SOFT_YELLOW, radius:0.03});
  vectorGLeft = drawThickVector3D(scene2,GLeft,endpointGLeft,{color:SOFT_BLUE, radius:0.03});
  vectorWLeft = drawThickVector3D(scene2,WLeft,endpointWLeft,{color:SOFT_BLUE, radius:0.03});
  drawThickVector3D(scene2,[0,0,0],[-1,0,0],{radius:0.03, headRadius:0.07});
  drawThickVector3D(scene2,[0,0,0],[0,1,0],{radius:0.03, headRadius:0.07});

  //arcs
  alphaArcLeft = drawArc(scene2,new THREE.Vector3(0,0,1),new THREE.Vector3(0,10),new THREE.Vector3(0,9),alpha,{tubeRadius:0.01});
  betaArcLeft = drawArc(scene2,new THREE.Vector3(0,0,1),new THREE.Vector3(4*Math.sin(alpha),10-4*Math.cos(alpha)),new THREE.Vector3(4*Math.sin(alpha),10-4*Math.cos(alpha)-0.7),beta,{tubeRadius:0.01});

  //labels
  addLatexLabel(scene2,`z`,-1,0.3,0,{size:5});
  addLatexLabel(scene2,`y`,-0.4,1,0, {size:5});
  addLatexLabel(scene2,`\\text{VLD yz-aanzicht:}`,-3,12,0,{size:7});

  labelAlphaLeft = addLatexLabel(scene2,`\\alpha`,0.1,8.8,0,{size:4, color:WHITE});
  labelBetaLeft = addLatexLabel(scene2,`\\beta`,4*Math.sin(alpha),10-4*Math.cos(alpha)-0.5,0,{size:4, color:WHITE});
  labelGLeft = addLatexLabel(scene2,`\\vec{G} = \\left\\{ \\begin{matrix} 0 \\\\ -1,8\\text{ kN} \\\\ 0 \\end{matrix} \\right\\}`,4*Math.sin(alpha)+Math.sin(beta)+0.1,10-4*Math.cos(alpha)-Math.cos(beta)-0.9*G/scaleF,0,{size:9, color:SOFT_BLUE});
  labelWLeft = addLatexLabel(scene2,`\\vec{F}_W = \\left\\{ \\begin{matrix} 0 \\\\ 0 \\\\ -800 \\text{ N}  \\end{matrix} \\right\\}`,4*Math.sin(alpha)+1.333*Math.sin(beta)+W/scaleF,10-4*Math.cos(alpha)-1.333*Math.cos(beta)+0.2,0,{size:9, color:SOFT_BLUE});
  labelKLeft = addLatexLabel(scene2,`2\\vec{F}_{K,yz} = 2F_K \\left\\{ \\begin{matrix} 0 \\\\ \\cos(\\theta)\\cos(\\alpha) \\\\ \\cos(\\theta)\\sin(\\alpha)  \\end{matrix} \\right\\}`,4*Math.sin(alpha)+K/scaleF*dir.y+0.4,10-4*Math.cos(alpha)+K/scaleF*dir.z,0,{size:9, color:SOFT_YELLOW});
  labelALeft = addLatexLabel(scene2,`A-B`,4*Math.sin(alpha)+0.3,10-4*Math.cos(alpha),0,{size:4, color:SOFT_RED});



}

async function initRightMap() {
  setup3DMap();

  //coordinate axes
  xAs = drawThickVector3D(scene,-6,4.5,0,-4,4.5,0);
  yAs = drawThickVector3D(scene,-6,4.5,0,-6,4.5,2);
  zAs = drawThickVector3D(scene,-6,4.5,0,-6,2.5,0);

  
  //surface
  const surface = drawParametricSurface3D(scene,"-6","u","v","u","v",-0.5,4.5,0,11,{color:SOFT_BLUE, opacity:0.2});
  const surface2 = drawParametricSurface3D(scene,"6","u","v","u","v",-0.5,4.5,0,11,{color:SOFT_BLUE, opacity:0.2});
  const surface3 = drawParametricSurface3D(scene,"v","u","0","u","v",-0.5,4.5,-6,6,{color:SOFT_BLUE, opacity:0.2});
  cloth = drawParametricSurface3D(scene,"-2+4*u","4*Math.sin(24*Math.PI/180)+v*Math.sin(30.7*Math.PI/180)","10-4*Math.cos(24*Math.PI/180)-v*Math.cos(30.7*Math.PI/180)","u","v",0,1,0.667,2,{color:SOFT_PURPLE, opacity:0.5});

  //Points
  pointLeftWall = drawDot3D(scene,-6,0,10,0.01,SOFT_GREEN);
  pointRightWall = drawDot3D(scene,6,0,10,0.01,SOFT_GREEN);
  point1 = drawDot3D(scene,-6,0,6,0.01,WHITE);

  pointA = drawDot3D(scene,-2,4*Math.sin(alpha),10-4*Math.cos(alpha),0.1,SOFT_RED);
  pointB = drawDot3D(scene,2,4*Math.sin(alpha),10-4*Math.cos(alpha),0.1,SOFT_RED);
  pointD = drawDot3D(scene,-2,4*Math.sin(alpha)+2*Math.sin(beta),10-4*Math.cos(alpha)-2*Math.cos(beta),0.1,SOFT_RED);
  pointC = drawDot3D(scene,2,4*Math.sin(alpha)+2*Math.sin(beta),10-4*Math.cos(alpha)-2*Math.cos(beta),0.1,SOFT_RED);  
  pointG = drawDot3D(scene,0,4*Math.sin(alpha)+Math.sin(beta),10-4*Math.cos(alpha)-Math.cos(beta),0.1,SOFT_RED);
  pointW = drawDot3D(scene,0,4*Math.sin(alpha)+1.333*Math.sin(beta),10-4*Math.cos(alpha)-1.333*Math.cos(beta),0.1,SOFT_PURPLE);



  point2 = drawDot3D(scene,-6,4*Math.sin(alpha),10-4*Math.cos(alpha),0.01,SOFT_GREEN);

  endpointK = drawDot3D(scene,-2+K/scaleF*dir.x,4*Math.sin(alpha)+K/scaleF*dir.y,10-4*Math.cos(alpha)+K/scaleF*dir.z,0.01,WHITE);
  endpointK2 = drawDot3D(scene,2-K/scaleF*dir.x,4*Math.sin(alpha)+K/scaleF*dir.y,10-4*Math.cos(alpha)+K/scaleF*dir.z,0.01,WHITE);
  endpointKyz = drawDot3D(scene,-2,4*Math.sin(alpha)+K/scaleF*dir.y,10-4*Math.cos(alpha)+K/scaleF*dir.z,0.01,WHITE);
  endpointW = drawDot3D(scene,0,4*Math.sin(alpha)+1.333*Math.sin(beta)+W/scaleF,10-4*Math.cos(alpha)-1.333*Math.cos(beta),0.01,SOFT_PURPLE);
  endpointG = drawDot3D(scene,0,4*Math.sin(alpha)+Math.sin(beta),10-4*Math.cos(alpha)-Math.cos(beta)-G/scaleF,0.01,SOFT_RED);

  //Lines
  dotLine1 = drawLine3D(scene, endpointK, endpointKyz,{dashed:true});
 

  leftRope = drawLine3D(scene,pointLeftWall,pointA,{color:SOFT_GREEN, dashed:true} );
  rightRope = drawLine3D(scene,pointRightWall,pointB,{color:SOFT_GREEN, dashed:true} );
  lineAB =   drawThickLine3D(scene,pointA,pointB,{color:SOFT_RED, radius:0.05} );
  lineBC =   drawThickLine3D(scene,pointC,pointB,{color:SOFT_RED, radius:0.05} );
  lineCD =   drawThickLine3D(scene,pointC,pointD,{color:SOFT_RED, radius:0.05} );
  lineAD =   drawThickLine3D(scene,pointA,pointD,{color:SOFT_RED, radius:0.05} );

  line1 =   drawLine3D(scene,pointLeftWall,point1,{color:WHITE, dashed:true} );
  line2 =   drawLine3D(scene,pointLeftWall,point2,{color:BRIGHT_GREEN, dashed:true} );

  //Vectors
  vectorK = drawThickVector3D(scene,pointA,endpointK,{color:SOFT_BLUE, radius:0.05});
  vectorK2 = drawThickVector3D(scene,pointB,endpointK2,{color:SOFT_BLUE, radius:0.05});
  vectorKyz = drawThickVector3D(scene,pointA,endpointKyz,{color:SOFT_YELLOW, radius:0.01, headRadius: 0.04});
  vectorG = drawThickVector3D(scene,pointG,endpointG,{color:SOFT_BLUE, radius:0.05});
  vectorW = drawThickVector3D(scene,pointW,endpointW,{color:SOFT_BLUE, radius:0.05});

  //arcs
  alphaArc = drawArc(scene,new THREE.Vector3(1,0,0),new THREE.Vector3(-6,0,10),new THREE.Vector3(-6,0,8),alpha,{tubeRadius:0.01});
  thetaArc = drawArc(scene,new THREE.Vector3(0,-Math.cos(alpha),-Math.sin(alpha)),new THREE.Vector3(-6,0,10),new THREE.Vector3(-6,1.5*Math.sin(alpha),10-1.5*Math.cos(alpha)),Math.PI/4,{color:BRIGHT_GREEN, tubeRadius:0.01});

  // labels
  labelX = addLatexLabel(scene,`x`,-4,4.5,0.5,{size:5, color:WHITE});
  labelY = addLatexLabel(scene,`y`,-5.5,4.5,2,{size:5, color:WHITE});
  labelZ = addLatexLabel(scene,`z`,-5.5,2.5,0.5,{size:5, color:WHITE});

  labelA = await addLatexLabel(scene,`A`,-1.7,0.3+4*Math.sin(alpha),10-4*Math.cos(alpha),{size:4, color:WHITE});
  labelB = await addLatexLabel(scene,`B`,2.3,0.3+4*Math.sin(alpha),10-4*Math.cos(alpha),{size:4, color:WHITE});
  labelTheta = await addLatexLabel(scene,`\\theta`,-5.3,1.7*Math.sin(alpha),10-1.7*Math.cos(alpha),{size:4, color:SOFT_GREEN});
  labelAlpha = await addLatexLabel(scene,`\\alpha`,-5.8,2.3*Math.sin(alpha/2),10-2.3*Math.cos(alpha/2),{size:4, color:WHITE});
  labelK = await addLatexLabel(scene,`\\vec{F}_{K1}`,-2+1.1*K/scaleF*dir.x,4*Math.sin(alpha)+1.1*K/scaleF*dir.y,10-4*Math.cos(alpha)+1.1*K/scaleF*dir.z,{size:4, color:SOFT_BLUE});
  labelK2 = await addLatexLabel(scene,`\\vec{F}_{K2}`,2-1.1*K/scaleF*dir.x,4*Math.sin(alpha)+1.1*K/scaleF*dir.y,10-4*Math.cos(alpha)+1.1*K/scaleF*dir.z,{size:4, color:SOFT_BLUE});
  labelG = await addLatexLabel(scene,`\\vec{G}`,0.2,4*Math.sin(alpha)+Math.sin(beta),10-4*Math.cos(alpha)-Math.cos(beta)-0.9*G/scaleF,{size:4, color:SOFT_BLUE});
  labelW = await addLatexLabel(scene,`\\vec{F}_{W}`,0.2,4*Math.sin(alpha)+1.333*Math.sin(beta)+0.9*W/scaleF,10-4*Math.cos(alpha)-1.333*Math.cos(beta),{size:4, color:SOFT_BLUE});
  labelKyz = await addLatexLabel(scene,`(\\vec{F}_{K, yz})`,-1.9,4*Math.sin(alpha)+1.1*K/scaleF*dir.y,10-4*Math.cos(alpha)+1.1*K/scaleF*dir.z,{size:2.5, color:SOFT_YELLOW});

 

}

async function updateRightMap(){
  pointA.update(-2, 4*Math.sin(alpha), 10-4*Math.cos(alpha));
  pointB.update( 2, 4*Math.sin(alpha), 10-4*Math.cos(alpha));
  point2.update(-6, 4*Math.sin(alpha), 10-4*Math.cos(alpha));
  dir.set(-Math.cos(Math.PI/4), -Math.sin(Math.PI/4)*Math.sin(alpha),Math.sin(Math.PI/4)*Math.cos(alpha));
  //endpointK.update(-2+3*dir.x,4*Math.sin(alpha)+3*dir.y,10-4*Math.cos(alpha)+3*dir.z);
  //endpointKyz.update(-2,4*Math.sin(alpha)+3*dir.y,10-4*Math.cos(alpha)+3*dir.z);


  dotLine1.update(endpointK,endpointKyz);

  leftRope.update(pointLeftWall, pointA);
  rightRope.update(pointRightWall, pointB);
  lineAB.update(pointA, pointB);
  line2.update(pointLeftWall, point2);
  
  //vectorK.update(pointA, endpointK);
  //vectorKyz.update(pointA, endpointKyz);
  
  alphaArc.delete();
  alphaArc = drawArc(scene,new THREE.Vector3(1,0,0),new THREE.Vector3(-6,0,10),new THREE.Vector3(-6,0,8),alpha,2);
 
  thetaArc.delete();
  thetaArc = drawArc(scene,new THREE.Vector3(0,-Math.cos(alpha),-Math.sin(alpha)),new THREE.Vector3(-6,0,10),new THREE.Vector3(-6,1.5*Math.sin(alpha),10-1.5*Math.cos(alpha)),Math.PI/4,{color:BRIGHT_GREEN});

  
  labelA.update({y:0.3+4*Math.sin(alpha), z:10-4*Math.cos(alpha)});
  labelB.update({y:0.3+4*Math.sin(alpha), z:10-4*Math.cos(alpha)});
  labelTheta.update({y:1.7*Math.sin(alpha), z:10-1.7*Math.cos(alpha)});
  let sizeAlpha = 3;
  if (alpha < 0.1){sizeAlpha = 0};
  labelAlpha.update({y:2.3*Math.sin(alpha/2), z:10-2.3*Math.cos(alpha/2), size:sizeAlpha});
 



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
  camera.lookAt(0,4*Math.sin(alpha),10-4*Math.cos(alpha));
  camera.up.set(0, 0, 1); // 👈 This tells OrbitControls that Z is the up direction
  scene.add(camera);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.screenSpacePanning = false;
  controls.target.set(0,4*Math.sin(alpha),10-4*Math.cos(alpha)); // THIS is the real “look at” point for OrbitControls
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


  renderer2 = new THREE.WebGLRenderer({ antialias: true,preserveDrawingBuffer: true  });
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
if (alphaArcLeft) {
  alphaArcLeft.delete();
  alphaArcLeft = null;
}
if (betaArcLeft) {
  betaArcLeft.delete();
  betaArcLeft = null;
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

}

export default { init, cleanup };
