const controlCanvas = document.getElementById("controlCanvas");
const controlCtx = controlCanvas.getContext("2d");

let currentSceneIndex = 0;
const scenes = ["scene0","scene1", "scene2", "scene3","scene4", "scene5","scene6"];
let lastScene = null;
let lastSceneModule = null;  

const sceneDescriptions = [
  `<p style="font-size: 28px;">Statica - oefening 2.4</p>Probeer eerst zelf deelvragen a) en b) op te lossen. <br>
  <br> Voor deelvraag c) vind je op de volgende pagina's enkele tips die je stap voor stap op weg helpen naar de oplossing.`,
  `Deelvraag c, Tip 1:<br>
  <br>De hoek $\\theta$ die elk van de kabels maakt met het vlak van de muur is <strong>onafhankelijk</strong> van de hoek $\\alpha$! <br>
  <br> Overtuig jezelf hiervan met onderstaande 3D-animatie. Met de slider kan je de hoek $\\alpha$ instellen, met de muis <br> kan je
  van camerastandpunt veranderen (linkermuisknop ingedrukt houden) en inzoomen (scroll).`,
  `Deelvraag c, Tip 2:<br>
  <br>De eenheidsvector $\\vec{e}_K$, gericht langsheen de kabel, kan in twee stappen ontbonden worden:
  <br> &nbsp;&nbsp;&nbsp;&nbsp;1. Via $\\theta$ kunnen we projecteren naar de x-as en naar het yz-vlak. 
  <br> &nbsp;&nbsp;&nbsp;&nbsp;2. Via $\\alpha$ kan de yz-projectie verder ontbonden worden naar y- en z-as. <br>
  <br> Ga op zoek naar de juiste rechthoekige driehoeken in onderstaande animatie en probeer zelf deze eenheidsvector op te stellen.`,
  `Deelvraag c, oplossing tip 2:<br>
  <br>Met deze projecties kunnen we de eenheidsvector $\\vec{e}_K$ schrijven als: 
  $$\\vec{e}_K = \\left \\{ \\begin{matrix}-\\sin(\\theta) \\\\ \\cos(\\theta)\\cos(\\alpha) \\\\ \\cos(\\theta)\\sin(\\alpha)  \\end{matrix}\\right \\}$$`,
  `Deelvraag c, Tip 3: Hieronder zie je het VLD voor het reclamebord.<br> 
  <br>Vooral het yz-aanzicht van dit VLD (links) is relevant. <br> 
  Krachtenevenwicht in de x-riching leert ons immers enkel dat de twee kabelkrachten even groot moeten zijn, <br>
  maar dat kon je ook al besluiten uit de symmetrie van de constructie.<br>
  <br>Probeer zelf met het VLD van het yz-aanzicht aan de slag te gaan om $F_K$, $\\alpha$ en $\\beta$ te berekenen.`,
  `Deelvraag c, Tip 4:<br>
  <br>Krachtenevenwicht in y- en z-richting levert alvast twee vergelijkingen waaruit je de onbekenden $F_K$ en $\\alpha$ kan berekenen. <br>
  <br>De hoek $\\beta$ kan je vervolgens het snelst berekenen door momentenevenwicht omheen de as A-B te gebruiken.<br>
  <br><i>(opl: $F_K = 1393$ N, $\\alpha = 24,0^\\circ$, $\\beta = 30,7^\\circ$)</i>`,
  `Deelvraag d:<br>
  Met onderstaande sliders kan je zowel de grootte van de windkracht als de hoogte van het aangrijpingspunt van de windkracht aanpassen.<br>
  Merk het effect op van de hoogte van het aangrijpingspunt:<br>
  &nbsp;&nbsp;&nbsp;&nbsp;$\\bullet$ $\\beta < \\alpha$, als het aangrijpingspunt van de windkracht boven het zwaartepunt van het bord ligt.<br>
  &nbsp;&nbsp;&nbsp;&nbsp;$\\bullet$ $\\beta > \\alpha$, als het aangrijpingspunt van de windkracht onder het zwaartepunt van het bord ligt.<br>
  &nbsp;&nbsp;&nbsp;&nbsp;$\\bullet$ $\\beta = \\alpha$, als het aangrijpingspunt van de windkracht samenvalt met het zwaartepunt van het bord.<br>
  Tracht dit zelf logisch te begrijpen door na te denken over momentenevenwicht omheen een as door het zwaartepunt.`
];

const sceneTextDiv = document.getElementById("sceneText");

function updateSceneText(index) {
  if (sceneDescriptions[index]) {
    sceneTextDiv.innerHTML = sceneDescriptions[index];
  } else {
    sceneTextDiv.textContent = "";
  }

  if (window.MathJax && MathJax.typesetPromise) {
    MathJax.typesetClear();
    MathJax.typesetPromise([sceneTextDiv]).catch((err) => console.error(err.message));
  }
}

// 🔹 New function: dynamically scale text size
function resizeSceneText() {
  const controlPanel = document.getElementById("controlPanel");
  const sceneText = document.getElementById("sceneText");

  const baseHeight = 250; // expected "design" height of controlPanel
  const scale = controlPanel.clientHeight / baseHeight;
  
  // Minimum readable size
  const newFontSize = Math.max(14, 22 * scale);
  sceneText.style.fontSize = `${newFontSize}px`;
}

// Resize control canvas to match container
function resizeControlCanvas() {
  const container = document.getElementById("controlPanel");
  controlCanvas.width = container.clientWidth;
  controlCanvas.height = container.clientHeight;
  drawControlPanel();
  resizeSceneText(); // <--- ensure text scales too
}

// Draw UI with buttons
function drawControlPanel() {
  controlCtx.clearRect(0, 0, controlCanvas.width, controlCanvas.height);

  const w = controlCanvas.width;
  const h = controlCanvas.height;
  const btnW = 100;
  const btnH = 40;

  controlCtx.font = "16px sans-serif";
  controlCtx.textAlign = "center";
  controlCtx.textBaseline = "middle";

  if (currentSceneIndex > 0) {
    controlCtx.fillStyle = "gray";
    controlCtx.fillRect(20, h / 2 - btnH / 2, btnW, btnH);
    controlCtx.fillStyle = "white";
    controlCtx.fillText("Previous", 20 + btnW / 2, h / 2);
  }

  if (currentSceneIndex < scenes.length - 1) {
    controlCtx.fillStyle = "gray";
    controlCtx.fillRect(w - btnW - 20, h / 2 - btnH / 2, btnW, btnH);
    controlCtx.fillStyle = "white";
    controlCtx.fillText("Next", w - btnW / 2 - 20, h / 2);
  }
}

// Handle click events
controlCanvas.addEventListener("click", (e) => {
  const rect = controlCanvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const w = controlCanvas.width;
  const h = controlCanvas.height;
  const btnW = 100;
  const btnH = 40;

  if (x >= 20 && x <= 20 + btnW && y >= h / 2 - btnH / 2 && y <= h / 2 + btnH / 2) {
    changeScene(currentSceneIndex - 1);
  }

  if (x >= w - btnW - 20 && x <= w - 20 && y >= h / 2 - btnH / 2 && y <= h / 2 + btnH / 2) {
    changeScene(currentSceneIndex + 1);
  }
});

// Scene switching
function changeScene(index) {
  currentSceneIndex = (index + scenes.length) % scenes.length;
  drawControlPanel();
  updateSceneText(currentSceneIndex);
  loadScene(`${scenes[currentSceneIndex]}.js`);
}

// Load scene dynamically
async function loadScene(scenePath) {
  if (scenePath === lastScene) return;

  if (lastSceneModule && typeof lastSceneModule.cleanup === "function") {
    lastSceneModule.cleanup();
  }

  try {
    const module = await import(`./scenes/${scenePath}`);
    const scene = module.default;

    if (scene && typeof scene.init === "function") {
      scene.init();
    } else {
      console.warn("Scene does not export an 'init()' function:", scenePath);
    }

    lastScene = scenePath;
    lastSceneModule = scene;
  } catch (err) {
    console.error("Failed to load scene:", scenePath, err);
  }
}

async function init() {
  resizeControlCanvas();
  new ResizeObserver(resizeControlCanvas).observe(controlCanvas);
  resizeSceneText(); // initialize font scaling
  await loadScene(`${scenes[currentSceneIndex]}.js`);
  updateSceneText(currentSceneIndex);
}

init();
