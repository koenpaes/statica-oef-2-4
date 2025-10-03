//Include this statement in the beginning of your document:
//
//    import {createArcAroundAxis3D, addAxes3D, drawParametricCurve3D, drawParametricSurface3D, drawDot3D, drawLine3D, drawVector3D, drawVector2D, 
//    drawLine2D, drawDot2D, drawFunction2D, makeDraggable, makeDraggableAlongCurve, makeDraggableAcrossSurface, addLatexLabel, addTextLabel,
//    set2DCameraView, worldToScreenPosition, addLatexScreenLabel, insertPicture, drawThickLine3D,addSlider, drawArc, drawThickVector3D } from './helperFunctions.js';
//

import * as THREE from 'three';

// these functions are to be used on a THREE.scene ...

/**
 * Draws a 3D arc as a tube along a specified axis, starting from a specific point.
 * The radius is automatically determined as the distance from `center` to `startPoint`.
 *
 * @param {THREE.Scene} scene - The THREE.js scene to add the arc to.
 * @param {THREE.Vector3} axis - Axis around which the arc is defined (should be normalized).
 * @param {THREE.Vector3} center - Center of the arc.
 * @param {THREE.Vector3} startPoint - Point on the plane where the arc starts.
 * @param {number} angle - Arc angle in radians.
 * @param {object} options - Optional configuration:
 *   @param {number|string} [options.color=0xffffff] - Color of the arc.
 *   @param {number} [options.tubeRadius=0.02] - Radius of the tube.
 *   @param {number} [options.radialSegments=8] - Radial segments of the tube.
 *   @param {number} [options.tubularSegments=64] - Segments along the curve.
 *   @param {boolean} [options.closed=false] - Whether to close the tube (default: false).
 * @returns {object} Object containing the `mesh` and a `.delete()` method.
 */
export function drawArc(scene, axis, center, startPoint, angle, options = {}) {
  const {
    color = 0xffffff,
    tubeRadius = 0.02,
    radialSegments = 8,
    tubularSegments = 64,
    closed = false,
  } = options;

  // Validate startPoint
  if (!(startPoint instanceof THREE.Vector3)) {
    throw new Error("drawArc: startPoint must be a THREE.Vector3 object");
  }

  // Normalize axis
  const axisNorm = axis.clone().normalize();

  // Arc radius = distance from center to startPoint
  const radius = center.distanceTo(startPoint);

  // Create orthonormal basis in the plane of the arc
  let u, v;
  if (Math.abs(axisNorm.x) < 0.001 && Math.abs(axisNorm.y) < 0.001) {
    u = new THREE.Vector3(1, 0, 0);
  } else {
    u = new THREE.Vector3(-axisNorm.y, axisNorm.x, 0).normalize();
  }
  v = new THREE.Vector3().crossVectors(axisNorm, u).normalize();

  // Compute starting angle
  const rel = startPoint.clone().sub(center);
  const uComp = rel.dot(u);
  const vComp = rel.dot(v);
  const startAngle = Math.atan2(vComp, uComp);

  // Define the arc curve
  class ArcCurve3D extends THREE.Curve {
    getPoint(t) {
      const theta = startAngle + t * angle;
      return center.clone()
        .add(u.clone().multiplyScalar(Math.cos(theta) * radius))
        .add(v.clone().multiplyScalar(Math.sin(theta) * radius));
    }
  }

  const curve = new ArcCurve3D();
  const geometry = new THREE.TubeGeometry(curve, tubularSegments, tubeRadius, radialSegments, closed);
  const material = new THREE.MeshStandardMaterial({ color });
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  return {
    mesh,
    delete() {
      if (mesh.parent) mesh.parent.remove(mesh);
      geometry.dispose();
      material.dispose();
    }
  };
}



/**
 * Creates a 3D arc (line) around a specified axis in a Three.js scene.
 *
 * @param {number} radius - The radius of the arc (distance from origin).
 * @param {number} startAngle - The starting angle of the arc in radians.
 * @param {number} endAngle - The ending angle of the arc in radians.
 * @param {number} segments - The number of line segments to approximate the arc.
 * @param {THREE.Vector3} axis - The axis vector around which the arc is rotated (normalized internally).
 * @param {THREE.Vector3} startDir - The initial direction vector from which rotation starts (should be perpendicular to axis).
 * @param {number} color - The color of the arc line in hexadecimal (e.g., 0xff0000 for red).
 * @returns {THREE.Line} - A Three.js Line object representing the arc.
 *
 * The function works by:
 * 1. Normalizing the axis of rotation.
 * 2. Normalizing and scaling the start direction vector to the given radius.
 * 3. Iteratively rotating the start vector around the axis by incremental angles from startAngle to endAngle.
 * 4. Collecting the rotated points into a geometry.
 * 5. Creating a line material with the specified color.
 * 6. Returning a THREE.Line object that can be added to the scene.
 */
export function createArcAroundAxis3D(
  radius = 1.1,
  startAngle = 0,
  endAngle = Math.PI * 2,
  segments = 128,
  axis = new THREE.Vector3(0, 1, 0),
  startDir = new THREE.Vector3(1, 0, 0),
  color = 0xff0000
) {
  // Normalize the axis vector to ensure proper rotation
  const normAxis = axis.clone().normalize();

  // Normalize and scale the starting direction vector by the radius
  const baseVec = startDir.clone().normalize().multiplyScalar(radius);

  // Array to hold points of the arc
  const points = [];

  // Calculate points along the arc by rotating the base vector incrementally around the axis
  for (let i = 0; i <= segments; i++) {
    const t = i / segments; // interpolation factor from 0 to 1
    const angle = startAngle + t * (endAngle - startAngle); // current rotation angle

    // Create a quaternion representing rotation around the normalized axis by the current angle
    const quat = new THREE.Quaternion().setFromAxisAngle(normAxis, angle);

    // Apply the quaternion rotation to the base vector to get the new point on the arc
    const rotated = baseVec.clone().applyQuaternion(quat);

    // Store the rotated point
    points.push(rotated);
  }

  // Create a BufferGeometry from the points array
  const geometry = new THREE.BufferGeometry().setFromPoints(points);

  // Create a basic line material with the specified color
  const material = new THREE.LineBasicMaterial({ color });

  // Create and return a THREE.Line object representing the arc
  return new THREE.Line(geometry, material);
}

/**
 * Adds X, Y, and Z axis arrows with optional labels to a Three.js scene.
 *
 * @param {THREE.Scene} scene - The scene to which the arrows will be added.
 * @param {number} xMin - Minimum value along the X-axis.
 * @param {number} xMax - Maximum value along the X-axis.
 * @param {number} yMin - Minimum value along the Y-axis.
 * @param {number} yMax - Maximum value along the Y-axis.
 * @param {number} zMin - Minimum value along the Z-axis.
 * @param {number} zMax - Maximum value along the Z-axis.
 * @param {object} [options] - Optional settings.
 * @param {number} [options.headLength=0.1] - Arrowhead length.
 * @param {number} [options.headWidth=0.05] - Arrowhead width.
 * @param {object} [options.colors] - Custom axis colors.
 * @param {number} [options.colors.x=0xffffff]
 * @param {number} [options.colors.y=0xffffff]
 * @param {number} [options.colors.z=0xffffff]
 * @param {string} [options.labelX=''] - Optional label for X-axis.
 * @param {string} [options.labelY=''] - Optional label for Y-axis.
 * @param {string} [options.labelZ=''] - Optional label for Z-axis.
 */
export function addAxes3D(
  scene,
  xMin, xMax,
  yMin, yMax,
  zMin, zMax,
  options = {}
) {
  const {
    headLength = 0.05,
    headWidth = 0.02,
    colors = {
      x: 0xffffff,
      y: 0xffffff,
      z: 0xffffff,
    },
    labelX = '',
    labelY = '',
    labelZ = '',
  } = options;

  const createArrow = (startVec, endVec, color, label) => {
    const dir = new THREE.Vector3().subVectors(endVec, startVec).normalize();
    const length = startVec.distanceTo(endVec);
    const arrow = new THREE.ArrowHelper(dir, startVec, length, color, headLength, headWidth);
    scene.add(arrow);

    if (label) {
      const sprite = createTextSprite(label);
      
      // Copy the arrow tip position
      const labelPos = endVec.clone();

      // Create an "up" vector to offset the label above the arrow tip
      // You can choose any vector not parallel to dir; here we pick global up (0,0,1)
      const up = new THREE.Vector3(0, 0, 1);

      // Compute perpendicular vector to dir and up
      let offset = new THREE.Vector3().crossVectors(dir, up);
      if (offset.lengthSq() === 0) {
        // dir and up are parallel, choose another up vector
        offset = new THREE.Vector3(0, 1, 0);
      }
      offset.normalize();

      // Offset the label a bit (tweak 0.1 for spacing)
      labelPos.addScaledVector(offset, 0.05);

      // Set label position
      sprite.position.copy(labelPos);
      scene.add(sprite);
    }

  };

  const createTextSprite = (text) => {
    const canvas = document.createElement('canvas');
    const size = 256;
    canvas.width = canvas.height = size;
    const context = canvas.getContext('2d');
    context.fillStyle = 'white';
    context.font = '64px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(text, size / 2, size / 2);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(0.3, 0.3, 0.3);
    return sprite;
  };

  // X-axis
  createArrow(
    new THREE.Vector3(xMin, 0, 0),
    new THREE.Vector3(xMax, 0, 0),
    colors.x,
    labelX
  );

  // Y-axis
  createArrow(
    new THREE.Vector3(0, yMin, 0),
    new THREE.Vector3(0, yMax, 0),
    colors.y,
    labelY
  );

  // Z-axis
  createArrow(
    new THREE.Vector3(0, 0, zMin),
    new THREE.Vector3(0, 0, zMax),
    colors.z,
    labelZ
  );
}

/**
 * Draws a thick 3D parametric curve using THREE.TubeGeometry.
 * This is a reliable alternative to MeshLine for rendering curves with customizable thickness.
 *
 * @param {THREE.Scene} scene - The Three.js scene to which the curve will be added.
 * @param {string} xExpr - A string expression defining x as a function of the parameter (e.g., "Math.sin(t)").
 * @param {string} yExpr - A string expression defining y as a function of the parameter.
 * @param {string} zExpr - A string expression defining z as a function of the parameter.
 * @param {string} param - The name of the parameter used in the expressions (e.g., "t" or "u").
 * @param {number} param_low - The starting value of the parameter.
 * @param {number} param_high - The ending value of the parameter.
 * @param {Object} [options] - Optional settings for curve appearance.
 * @param {number} [options.color=0xffffff] - Color of the tube as a hex or CSS color string.
 * @param {number} [options.radius=0.01] - Radius (thickness) of the tube.
 * @param {number} [options.segments=100] - Number of segments used to sample the curve.
 * @param {number} [options.radialSegments=8] - Number of segments around the tube's cross-section.
 *
 * @returns {THREE.Mesh} The mesh object representing the thick curve (TubeGeometry).
 *
 * @example
 * // Example usage:
 * drawThickParametricCurve(
 *   scene,
 *   "Math.sin(u)",
 *   "Math.cos(u)",
 *   "u",
 *   "u",
 *   0,
 *   Math.PI * 2,
 *   { color: 0xff0000, radius: 0.02 }
 * );
 */
export function drawParametricCurve3D(
  scene,
  xExpr,
  yExpr,
  zExpr,
  param,
  param_low,
  param_high,
  {
    color = 0xffffff,
    radius = 0.01,
    segments = 100,
    radialSegments = 8,
  } = {}
) {
  const xFunc = new Function(param, `return ${xExpr};`);
  const yFunc = new Function(param, `return ${yExpr};`);
  const zFunc = new Function(param, `return ${zExpr};`);

  const points = [];
  for (let i = 0; i <= segments; i++) {
    const t = param_low + (param_high - param_low) * (i / segments);
    points.push(new THREE.Vector3(xFunc(t), yFunc(t), zFunc(t)));
  }

  const curve = new THREE.CatmullRomCurve3(points);
  const geometry = new THREE.TubeGeometry(curve, segments * 2, radius, radialSegments, false);
  const material = new THREE.MeshStandardMaterial({ color });
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  mesh.delete = function () {
    this.geometry.dispose();
    this.material.dispose();
    if (this.parent) {
      this.parent.remove(this);
    }
  };

  return mesh;
}

/**
 * Draws a smooth 3D parametric surface using BufferGeometry with optional transparency.
 *
 * @param {THREE.Scene} scene - The Three.js scene to which the surface will be added.
 * @param {string} xExpr - A string expression for x(u,v).
 * @param {string} yExpr - A string expression for y(u,v).
 * @param {string} zExpr - A string expression for z(u,v).
 * @param {string} uVar - Name of the u parameter (e.g., "u").
 * @param {string} vVar - Name of the v parameter (e.g., "v").
 * @param {number} uMin - Lower bound for u.
 * @param {number} uMax - Upper bound for u.
 * @param {number} vMin - Lower bound for v.
 * @param {number} vMax - Upper bound for v.
 * @param {Object} [options] - Rendering options.
 * @param {number|string} [options.color=0xffffff] - Surface color.
 * @param {number} [options.uSegments=50] - Segments in u direction.
 * @param {number} [options.vSegments=50] - Segments in v direction.
 * @param {boolean} [options.doubleSided=true] - Whether both sides of surface are rendered.
 * @param {number} [options.opacity=1.0] - Surface opacity (0.0 fully transparent, 1.0 fully opaque).
 *
 * @returns {THREE.Mesh} The generated parametric surface mesh.
 */
export function drawParametricSurface3D(
  scene,
  xExpr,
  yExpr,
  zExpr,
  uVar,
  vVar,
  uMin,
  uMax,
  vMin,
  vMax,
  {
    color = 0xffffff,
    uSegments = 50,
    vSegments = 50,
    doubleSided = true,
    opacity = 1.0,
  } = {}
) {
  const xFunc = new Function(uVar, vVar, `return ${xExpr};`);
  const yFunc = new Function(uVar, vVar, `return ${yExpr};`);
  const zFunc = new Function(uVar, vVar, `return ${zExpr};`);

  const geometry = new THREE.BufferGeometry();
  const positions = [];
  const indices = [];

  for (let i = 0; i <= uSegments; i++) {
    const u = uMin + (uMax - uMin) * (i / uSegments);
    for (let j = 0; j <= vSegments; j++) {
      const v = vMin + (vMax - vMin) * (j / vSegments);
      const x = xFunc(u, v);
      const y = yFunc(u, v);
      const z = zFunc(u, v);
      positions.push(x, y, z);
    }
  }

  for (let i = 0; i < uSegments; i++) {
    for (let j = 0; j < vSegments; j++) {
      const a = i * (vSegments + 1) + j;
      const b = a + vSegments + 1;

      indices.push(a, b, a + 1);
      indices.push(b, b + 1, a + 1);
    }
  }

  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  const material = new THREE.MeshStandardMaterial({
    color,
    side: doubleSided ? THREE.DoubleSide : THREE.FrontSide,
    transparent: opacity < 1.0,
    opacity,
    flatShading: false,
  });

  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  mesh.delete = function () {
    this.geometry.dispose();
    this.material.dispose();
    if (this.parent) {
      this.parent.remove(this);
    }
  };


  return mesh;
}

/**
 * Draws a dot (sphere) at a given position in a THREE.Scene.
 * Adds an `.update()` method to change the dot's position and/or color.
 *
 * @param {THREE.Scene} scene - The scene to add the dot to.
 * @param {number} x - X-coordinate of the dot.
 * @param {number} y - Y-coordinate of the dot.
 * @param {number} z - Z-coordinate of the dot.
 * @param {number} radius - Radius of the dot (sphere).
 * @param {number|string} color - Color of the dot (hex or CSS color string).
 *
 * @returns {THREE.Mesh} The created sphere mesh with an `.update()` method.
 *
 * @example
 * const dot = drawDot3D(scene, 1, 2, 3, 0.05, 0xff0000);
 * dot.update(4, 5, 6, 0x00ff00); // Move and recolor
 */
export function drawDot3D(scene, x, y, z, radius, color) {
  const geometry = new THREE.SphereGeometry(radius, 16, 16);
  const material = new THREE.MeshStandardMaterial({ color });
  const dot = new THREE.Mesh(geometry, material);

  dot.position.set(x, y, z);
  scene.add(dot);

  /**
   * Updates the position and/or color of the dot.
   * @param {number} newX - New X-coordinate.
   * @param {number} newY - New Y-coordinate.
   * @param {number} newZ - New Z-coordinate.
   * @param {number|string} [newColor] - Optional new color (hex or CSS).
   */
  dot.update = function (newX, newY, newZ, newColor) {
    this.position.set(newX, newY, newZ);
    if (newColor !== undefined) {
      this.material.color.set(newColor);
    }
  };

  return dot;
}

/**
 * Draws a line between two 3D points on a THREE.Scene and returns a THREE.Line object.
 * Supports arrays [x,y,z], THREE.Vector3, THREE.Mesh, or six separate numbers.
 * Includes an `.update()` method to modify endpoints dynamically.
 *
 * @param {THREE.Scene} scene - Scene to add the line to.
 * @param {THREE.Vector3|THREE.Mesh|Array<number>|number} from - Start point or X coordinate.
 * @param {THREE.Vector3|THREE.Mesh|Array<number>|number} to - End point or X coordinate.
 * @param {object} [options] - Optional styling parameters:
 *   @param {number|string} [options.color=0xffffff] - Line color.
 *   @param {number} [options.lineWidth=1] - Line width (note: ignored in most browsers).
 *   @param {boolean} [options.dashed=false] - Whether the line is dashed.
 *   @param {number} [options.dashSize=0.03] - Length of dashes (if dashed).
 *   @param {number} [options.gapSize=0.03] - Length of gaps between dashes (if dashed).
 * @returns {THREE.Line} The THREE.Line object added to the scene, with a `.update()` method.
 */
export function drawLine3D(scene, from, to, options = {}) {
  const {
    color = 0xffffff,
    lineWidth = 1,
    dashed = false,
    dashSize = 0.03,
    gapSize = 0.03,
  } = options;

  // Helper: normalize different input formats into THREE.Vector3
  function toVector3(input) {
    if (input instanceof THREE.Vector3) return input.clone();
    if (input instanceof THREE.Mesh) {
      const pos = new THREE.Vector3();
      input.getWorldPosition(pos);
      return pos;
    }
    if (Array.isArray(input) && input.length === 3) return new THREE.Vector3(...input);
    if (typeof input === "number") {
      // will be handled in 6-number overload
      return null;
    }
    throw new Error("drawLine3D: invalid input (must be Vector3, Mesh, [x,y,z], or numbers)");
  }

  // Support overload: six numbers
  if (
    arguments.length >= 8 &&
    typeof arguments[1] === "number" &&
    typeof arguments[2] === "number" &&
    typeof arguments[3] === "number" &&
    typeof arguments[4] === "number" &&
    typeof arguments[5] === "number" &&
    typeof arguments[6] === "number"
  ) {
    from = [arguments[1], arguments[2], arguments[3]];
    to = [arguments[4], arguments[5], arguments[6]];
  }

  let start = toVector3(from);
  let end = toVector3(to);

  // Define start and end points
  const points = [start, end];

  // Create geometry from points
  const geometry = new THREE.BufferGeometry().setFromPoints(points);

  // Choose material
  let material;
  if (dashed) {
    material = new THREE.LineDashedMaterial({
      color,
      dashSize,
      gapSize,
      linewidth: lineWidth,
    });
  } else {
    material = new THREE.LineBasicMaterial({
      color,
      linewidth: lineWidth,
    });
  }

  // Create line
  const line = new THREE.Line(geometry, material);

  // Compute line distances for dashed lines
  if (dashed) line.computeLineDistances();

  // Attach update method
  line.update = function (newFrom, newTo) {
    const p1 = toVector3(newFrom);
    const p2 = toVector3(newTo);

    const newPositions = new Float32Array([
      p1.x, p1.y, p1.z,
      p2.x, p2.y, p2.z,
    ]);

    this.geometry.setAttribute("position", new THREE.BufferAttribute(newPositions, 3));
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.computeBoundingSphere();

    if (this.computeLineDistances) this.computeLineDistances();
  };

  scene.add(line);
  return line;
}

/**
 * Draws a thick 3D line between two points using a cylinder mesh.
 * Supports arrays [x,y,z], THREE.Vector3, THREE.Mesh, or six separate numbers.
 * Includes an `.update()` method to modify endpoints dynamically.
 *
 * @param {THREE.Scene} scene - Scene to add the line to.
 * @param {THREE.Vector3|THREE.Mesh|Array<number>|number} from - Start point or X coordinate.
 * @param {THREE.Vector3|THREE.Mesh|Array<number>|number} to - End point or X coordinate.
 * @param {object} [options] - Optional parameters:
 *   @param {number|string} [options.color=0xffffff] - Line color.
 *   @param {number} [options.radius=0.02] - Line thickness.
 *   @param {number} [options.radialSegments=8] - Cylinder smoothness.
 *
 * @returns {THREE.Mesh} Cylinder representing the thick line, with `.update()` method.
 */
export function drawThickLine3D(scene, from, to, options = {}) {
  const { color = 0xffffff, radius = 0.05, radialSegments = 8 } = options;

  // Helper to convert various inputs to THREE.Vector3
  function toVector3(input) {
    if (input instanceof THREE.Vector3) return input.clone();
    if (input instanceof THREE.Mesh) {
      const pos = new THREE.Vector3();
      input.getWorldPosition(pos);
      return pos;
    }
    if (Array.isArray(input) && input.length === 3) return new THREE.Vector3(...input);
    throw new Error('drawThickLine3D: input must be a THREE.Vector3, THREE.Mesh, or [x,y,z] array');
  }

  // Support six separate numbers as arguments
  if (
    arguments.length >= 7 &&
    typeof arguments[1] === 'number' &&
    typeof arguments[2] === 'number' &&
    typeof arguments[3] === 'number' &&
    typeof arguments[4] === 'number' &&
    typeof arguments[5] === 'number' &&
    typeof arguments[6] === 'number'
  ) {
    from = [arguments[1], arguments[2], arguments[3]];
    to = [arguments[4], arguments[5], arguments[6]];
  }

  let start = toVector3(from);
  let end = toVector3(to);

  // Compute direction and length
  let dir = new THREE.Vector3().subVectors(end, start);
  let length = dir.length();

  // Create cylinder
  const geometry = new THREE.CylinderGeometry(radius, radius, length, radialSegments);
  const material = new THREE.MeshStandardMaterial({ color });
  const cylinder = new THREE.Mesh(geometry, material);

  // Position at midpoint
  const midpoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
  cylinder.position.copy(midpoint);

  // Orient along direction
  cylinder.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());

  scene.add(cylinder);

  // Store original length for proper scaling on updates
  const originalLength = length;

  // Attach update method
  cylinder.update = function(newFrom, newTo) {
    start = toVector3(newFrom);
    end = toVector3(newTo);

    dir = new THREE.Vector3().subVectors(end, start);
    const newLength = dir.length();

    // Scale along Y-axis relative to original geometry
    this.scale.set(1, newLength / originalLength, 1);

    // Update midpoint
    const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
    this.position.copy(mid);

    // Update orientation
    this.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
  };

  return cylinder;
}

/**
 * Draws a thick 3D vector (shaft + arrowhead) between two points.
 * Supports arrays [x,y,z], THREE.Vector3, THREE.Mesh, or six separate numbers.
 * Includes an `.update()` method to modify endpoints dynamically.
 *
 * @param {THREE.Scene} scene - Scene to add the vector to.
 * @param {THREE.Vector3|THREE.Mesh|Array<number>|number} from - Start point or X coordinate.
 * @param {THREE.Vector3|THREE.Mesh|Array<number>|number} to - End point or X coordinate.
 * @param {object} [options] - Optional parameters:
 *   @param {number|string} [options.color=0xffffff] - Vector color.
 *   @param {number} [options.radius=0.02] - Shaft thickness.
 *   @param {number} [options.headLength=0.3] - Length of the arrowhead.
 *   @param {number} [options.headRadius=0.06] - Radius of the arrowhead base.
 *   @param {number} [options.radialSegments=8] - Smoothness of geometry.
 *
 * @returns {THREE.Group} A group containing the shaft + arrowhead, with `.update()` method.
 */
export function drawThickVector3D(scene, from, to, options = {}) {
  const {
    color = 0xffffff,
    radius = 0.05,
    headLength = 0.3,
    headRadius = 0.12,
    radialSegments = 8
  } = options;

  // Helper: convert input to THREE.Vector3
  function toVector3(input) {
    if (input instanceof THREE.Vector3) return input.clone();
    if (input instanceof THREE.Mesh) {
      const pos = new THREE.Vector3();
      input.getWorldPosition(pos);
      return pos;
    }
    if (Array.isArray(input) && input.length === 3) return new THREE.Vector3(...input);
    throw new Error('drawThickVector3D: input must be a THREE.Vector3, THREE.Mesh, or [x,y,z] array');
  }

  // Handle six-number input: scene,x1,y1,z1,x2,y2,z2
  if (
    arguments.length === 7 &&
    typeof arguments[1] === "number" &&
    typeof arguments[2] === "number" &&
    typeof arguments[3] === "number" &&
    typeof arguments[4] === "number" &&
    typeof arguments[5] === "number" &&
    typeof arguments[6] === "number"
  ) {
    from = [arguments[1], arguments[2], arguments[3]];
    to = [arguments[4], arguments[5], arguments[6]];
  }

  let start = toVector3(from);
  let end = toVector3(to);

  // Compute direction and length
  let dir = new THREE.Vector3().subVectors(end, start);
  let length = dir.length();

  if (length < 1e-6) {
    console.warn("drawThickVector3D: zero-length vector, nothing drawn.");
    return new THREE.Group();
  }

  // Group container (shaft + head)
  const group = new THREE.Group();

  // Shaft
  const shaftLength = Math.max(0, length - headLength);
  const shaftGeom = new THREE.CylinderGeometry(radius, radius, shaftLength, radialSegments);
  const material = new THREE.MeshStandardMaterial({ color });
  const shaft = new THREE.Mesh(shaftGeom, material);

  // Shaft is centered, so shift it to align properly
  shaft.position.y = shaftLength / 2; 
  shaft.updateMatrix();

  // Arrowhead (cone)
  const headGeom = new THREE.ConeGeometry(headRadius, headLength, radialSegments);
  const head = new THREE.Mesh(headGeom, material);

  head.position.y = shaftLength + headLength / 2; 
  head.updateMatrix();

  group.add(shaft);
  group.add(head);

  // Place at start point, orient along Y
  group.position.copy(start);
  group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());

  scene.add(group);

  // Add update method
  group.update = (newFrom, newTo) => {
    start = toVector3(newFrom);
    end = toVector3(newTo);

    dir = new THREE.Vector3().subVectors(end, start);
    length = dir.length();

    // Dispose old geometries
    shaft.geometry.dispose();
    head.geometry.dispose();

    // Rebuild with new length
    const newShaftLength = Math.max(0, length - headLength);
    shaft.geometry = new THREE.CylinderGeometry(radius, radius, newShaftLength, radialSegments);
    shaft.position.y = newShaftLength / 2;

    head.geometry = new THREE.ConeGeometry(headRadius, headLength, radialSegments);
    head.position.y = newShaftLength + headLength / 2;

    // Reset transform
    group.position.copy(start);
    group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
  };

  return group;
}


/**
 * Draws a 3D vector (arrow) from one point to another in a THREE.Scene.
 * Adds an `.update()` method to change the start/end positions and/or color.
 *
 * @param {THREE.Scene} scene - The scene to add the vector to.
 * @param {number} fromX - Starting X coordinate.
 * @param {number} fromY - Starting Y coordinate.
 * @param {number} fromZ - Starting Z coordinate.
 * @param {number} toX - Ending X coordinate.
 * @param {number} toY - Ending Y coordinate.
 * @param {number} toZ - Ending Z coordinate.
 * @param {object} [options] - Optional styling parameters:
 *   - color: color of the arrow (default: 0xffffff)
 *   - headLength: length of the arrowhead (default: 0.05)
 *   - headWidth: width of the arrowhead (default: 0.02)
 *   - lineWidth: ignored (WebGL limitation unless using MeshLine)
 * @returns {THREE.ArrowHelper} - The ArrowHelper object with an `.update()` method.
 *
 * @example
 * const arrow = drawVector3D(scene, 0, 0, 0, 1, 1, 1, { color: 0xff0000 });
 * arrow.update(0, 0, 0, 2, 2, 2, 0x00ff00); // Move and change color
 */
export function drawVector3D(
  scene,
  fromX, fromY, fromZ,
  toX, toY, toZ,
  options = {}
) {
  const {
    color = 0xffffff,
    headLength = 0.05,
    headWidth = 0.02,
    lineWidth = 1 // Ignored
  } = options;

  const from = new THREE.Vector3(fromX, fromY, fromZ);
  const to = new THREE.Vector3(toX, toY, toZ);
  const dir = new THREE.Vector3().subVectors(to, from).normalize();
  const length = from.distanceTo(to);

  const arrow = new THREE.ArrowHelper(dir, from, length, color, headLength, headWidth);
  scene.add(arrow);

  /**
   * Updates the start and end points of the arrow and optionally its color.
   * @param {number} newFromX - New start X.
   * @param {number} newFromY - New start Y.
   * @param {number} newFromZ - New start Z.
   * @param {number} newToX - New end X.
   * @param {number} newToY - New end Y.
   * @param {number} newToZ - New end Z.
   * @param {number|string} [newColor] - Optional new color.
   */
  arrow.update = function (
    newFromX, newFromY, newFromZ,
    newToX, newToY, newToZ,
    newColor
  ) {
    const newFrom = new THREE.Vector3(newFromX, newFromY, newFromZ);
    const newTo = new THREE.Vector3(newToX, newToY, newToZ);
    const newDir = new THREE.Vector3().subVectors(newTo, newFrom).normalize();
    const newLength = newFrom.distanceTo(newTo);

    this.position.copy(newFrom);
    this.setDirection(newDir);
    this.setLength(newLength, headLength, headWidth);

    if (newColor !== undefined) {
      this.setColor(new THREE.Color(newColor));
    }
  };

  return arrow;
}

/**
 * Adds a slider UI element above a Three.js map container.
 * The slider controls a numeric value in real-time.
 *
 * @param {number} initialValue - Initial value of the slider.
 * @param {number} min - Minimum slider value.
 * @param {number} max - Maximum slider value.
 * @param {object} [options] - Optional settings:
 *   @param {number} [options.step=0.01] - Step size of slider.
 *   @param {string} [options.label] - Text label next to slider.
 *   @param {'leftMap'|'rightMap'} [options.map='rightMap'] - Target map container.
 *   @param {number} [options.offsetX=20] - Horizontal offset in pixels from top-left corner.
 *   @param {number} [options.offsetY=20] - Vertical offset in pixels from top-left corner.
 * @returns {object} An object containing:
 *   - `.getValue()` - Returns current slider value.
 *   - `.setValue(val)` - Updates the slider value programmatically.
 *   - `.remove()` - Removes the slider from DOM.
 */
export function addSlider(initialValue, min, max, options = {}) {
  const {
    step = 0.01,
    label = '',
    map = 'rightMap',
    offsetX = 20,
    offsetY = 20,
    isLatex = false,
  } = options;

  let parent;
  if (map === 'leftMap') parent = document.getElementById('leftMapContainer');
  else if (map === 'rightMap') parent = document.getElementById('rightMapContainer');
  else parent = document.body;

  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.top = `${offsetY}px`;
  container.style.left = `${offsetX}px`;
  container.style.background = 'rgba(0,0,0,0.5)';
  container.style.padding = '8px';
  container.style.borderRadius = '5px';
  container.style.color = '#fff';
  container.style.fontFamily = 'sans-serif';
  container.style.zIndex = '999';
  container.style.pointerEvents = 'auto';

  const labelElem = document.createElement('span');
  labelElem.style.marginRight = '14px';
  if (isLatex && label) {
    labelElem.innerHTML = `\\(${label}\\)`;   // inline math
    MathJax.typesetPromise([labelElem]);     // render MathJax dynamically
  } else {
    labelElem.textContent = label ? `${label}: ` : '';
  }
  container.appendChild(labelElem);

  const slider = document.createElement('input');
  slider.type = 'range';
  slider.min = min;
  slider.max = max;
  slider.step = step;
  slider.value = initialValue;
  slider.style.verticalAlign = 'middle';

  const valueElem = document.createElement('span');
  valueElem.textContent = slider.value;
  valueElem.style.marginLeft = '5px';

  container.appendChild(slider);
  container.appendChild(valueElem);
  parent.appendChild(container);

  let currentValue = parseFloat(slider.value);

  slider.addEventListener('input', () => {
    currentValue = parseFloat(slider.value);
    valueElem.textContent = currentValue.toFixed(2);
  });

  return {
    getValue() { return currentValue; },
    setValue(val) {
      currentValue = val;
      slider.value = val;
      valueElem.textContent = val.toFixed(2);
    },
    remove() {
      if (container.parentNode) container.parentNode.removeChild(container);
    },
    slider,
    container,
    valueElem,
  };
}

/**
 * Make a THREE.Mesh draggable with the mouse, constrained to a plane or surface.
 * @param {THREE.Scene} scene
 * @param {THREE.Mesh} mesh - The draggable object (e.g. a dot).
 * @param {THREE.Camera} camera
 * @param {THREE.Renderer} renderer
 * @param {OrbitControls} controls
 * @param {Object} options
 *   - constrainPlane: 'xy' | 'xz' | 'yz' | null
 *   - constrainToMesh: THREE.Mesh (e.g. a surface or curve to constrain movement to)
 * @returns {Function} cleanup function
 */
export function makeDraggable(scene, mesh, camera, renderer, controls, options = {}) {
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  const dragPlane = new THREE.Plane();
  const dragOffset = new THREE.Vector3();
  let isDragging = false;
  let constraintMesh = options.constrainToMesh ?? null;

  function getMouseRay(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
  }

  function onMouseDown(event) {
    getMouseRay(event);
    const intersects = raycaster.intersectObject(mesh);
    if (intersects.length > 0) {
      isDragging = true;
      controls.enabled = false;

      if (constraintMesh) return; // Skip plane setup

      // Plane constraint setup
      if (options.constrainPlane === 'xy') {
        dragPlane.setFromNormalAndCoplanarPoint(new THREE.Vector3(0, 0, 1), mesh.position);
      } else if (options.constrainPlane === 'xz') {
        dragPlane.setFromNormalAndCoplanarPoint(new THREE.Vector3(0, 1, 0), mesh.position);
      } else if (options.constrainPlane === 'yz') {
        dragPlane.setFromNormalAndCoplanarPoint(new THREE.Vector3(1, 0, 0), mesh.position);
      } else {
        dragPlane.setFromNormalAndCoplanarPoint(camera.getWorldDirection(new THREE.Vector3()), intersects[0].point);
      }

      dragOffset.copy(intersects[0].point).sub(mesh.position);
    }
  }

  function onMouseMove(event) {
    if (!isDragging) return;
    getMouseRay(event);

    if (constraintMesh) {
      const intersections = raycaster.intersectObject(constraintMesh);
      if (intersections.length > 0) {
        mesh.position.copy(intersections[0].point);
      }
    } else {
      const point = new THREE.Vector3();
      raycaster.ray.intersectPlane(dragPlane, point);
      mesh.position.copy(point.sub(dragOffset));
    }
  }

  function onMouseUp() {
    if (isDragging) {
      isDragging = false;
      controls.enabled = true;
    }
  }

  renderer.domElement.addEventListener('mousedown', onMouseDown);
  renderer.domElement.addEventListener('mousemove', onMouseMove);
  renderer.domElement.addEventListener('mouseup', onMouseUp);

  return () => {
    renderer.domElement.removeEventListener('mousedown', onMouseDown);
    renderer.domElement.removeEventListener('mousemove', onMouseMove);
    renderer.domElement.removeEventListener('mouseup', onMouseUp);
  };
}

/**
 * Make a dot draggable along a 3D parametric curve (1 degree of freedom).
 *
 * The dot can be moved by dragging with the mouse, or by updating the returned `.t` property.
 * You can also synchronize external values using the `updateFunc` callback.
 *
 * @param {THREE.Scene} scene - The Three.js scene.
 * @param {THREE.Mesh} dot - The mesh object (e.g., a sphere) that is draggable.
 * @param {THREE.Camera} camera - The camera used to render the scene.
 * @param {THREE.Renderer} renderer - The WebGL renderer.
 * @param {OrbitControls} controls - OrbitControls used for camera interaction (temporarily disabled during drag).
 * @param {function(t: number): THREE.Vector3} curveFunc - A function mapping parameter `t` to a position on the curve.
 * @param {number} t0 - Initial value of the parameter `t`.
 * @param {object} [options] - Optional configuration object.
 * @param {number} [options.tMin=0] - Minimum value of `t` along the curve.
 * @param {number} [options.tMax=1] - Maximum value of `t` along the curve.
 * @param {number} [options.segments=200] - Number of samples along the curve for ray intersection detection.
 * @param {function(parameterValue): void} [options.updateFunc] - Callback that gets called every time the dot position is updated (during dragging or programmatic changes).
 *
 * @returns {{
 *   get t(): number,
 *   set t(value: number): void,
 *   updateDot(): void,
 *   destroy(): void
 * }} Object with accessors and control methods.
 */
export function makeDraggableAlongCurve(scene, dot, camera, renderer, controls, curveFunc, t0, options = {}) {
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  const tMin = options.tMin ?? 0;
  const tMax = options.tMax ?? 1;
  const segments = options.segments ?? 200;
  const updateFunc = options.updateFunc;

  let isDragging = false;
  let currentT = t0;

  function updateDot() {
    const pos = curveFunc(currentT);
    dot.position.copy(pos);
    if (typeof updateFunc === 'function') {
      updateFunc(currentT);
    }
  }

  updateDot();

  function getMouseRay(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
  }

  function onMouseDown(event) {
    getMouseRay(event);
    const intersects = raycaster.intersectObject(dot);
    if (intersects.length > 0) {
      isDragging = true;
      controls.enabled = false;
    }
  }

  function onMouseMove(event) {
    if (!isDragging) return;
    getMouseRay(event);

    let closestT = currentT;
    let closestDist = Infinity;
    const ray = raycaster.ray;

    for (let i = 0; i <= segments; i++) {
      const t = tMin + (i / segments) * (tMax - tMin);
      const pt = curveFunc(t);
      const dist = ray.distanceSqToPoint(pt);
      if (dist < closestDist) {
        closestDist = dist;
        closestT = t;
      }
    }

    currentT = closestT;
    updateDot();
  }

  function onMouseUp() {
    if (isDragging) {
      isDragging = false;
      controls.enabled = true;
    }
  }

  renderer.domElement.addEventListener('mousedown', onMouseDown);
  renderer.domElement.addEventListener('mousemove', onMouseMove);
  renderer.domElement.addEventListener('mouseup', onMouseUp);

  return {
    /**
     * Current value of the curve parameter `t`.
     * Setting this updates the dot's position (and calls `updateFunc` if defined).
     */
    get t() { return currentT; },

    set t(value) {
      currentT = value;
      updateDot();
    },

    /**
     * Force an update of the dot's position (based on current `t`).
     */
    updateDot,

    /**
     * Clean up event listeners to avoid memory leaks.
     */
    destroy() {
      renderer.domElement.removeEventListener('mousedown', onMouseDown);
      renderer.domElement.removeEventListener('mousemove', onMouseMove);
      renderer.domElement.removeEventListener('mouseup', onMouseUp);
    }
  };
}

/**
 * Make a dot draggable across a 3D parametric surface (2 degrees of freedom).
 *
 * The dot can be moved by dragging with the mouse, or by updating the returned .u and .v properties.
 * You can also synchronize external values using the updateFunc callback.
 *
 * @param {THREE.Scene} scene - The Three.js scene.
 * @param {THREE.Mesh} dot - The mesh object (e.g., a sphere) that is draggable.
 * @param {THREE.Camera} camera - The camera used to render the scene.
 * @param {THREE.Renderer} renderer - The WebGL renderer.
 * @param {OrbitControls} controls - OrbitControls used for camera interaction (temporarily disabled during drag).
 * @param {function(u: number, v: number): THREE.Vector3} surfFunc - A function mapping parameters (u, v) to a point on the surface.
 * @param {number} u0 - Initial value of parameter u.
 * @param {number} v0 - Initial value of parameter v.
 * @param {object} [options] - Optional configuration object.
 * @param {number} [options.uMin=0]
 * @param {number} [options.uMax=1]
 * @param {number} [options.vMin=0]
 * @param {number} [options.vMax=1]
 * @param {number} [options.uSegments=50]
 * @param {number} [options.vSegments=50]
 * @param {function({u: number, v: number}): void} [options.updateFunc]
 *
 * @returns {{
 *   get u(): number,
 *   set u(value: number): void,
 *   get v(): number,
 *   set v(value: number): void,
 *   updateDot(): void,
 *   destroy(): void
 * }}
 */
export function makeDraggableAcrossSurface(scene, dot, camera, renderer, controls, surfFunc, u0, v0, options = {}) {
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  const uMin = options.uMin ?? 0;
  const uMax = options.uMax ?? 1;
  const vMin = options.vMin ?? 0;
  const vMax = options.vMax ?? 1;
  const uSegments = options.uSegments ?? 100; // increased for smoother drag
  const vSegments = options.vSegments ?? 100;
  const updateFunc = options.updateFunc;

  let isDragging = false;
  let currentU = u0;
  let currentV = v0;

  // Precompute grid of surface points for faster lookup
  const surfaceGrid = [];
  for (let i = 0; i <= uSegments; i++) {
    const u = uMin + (i / uSegments) * (uMax - uMin);
    surfaceGrid[i] = [];
    for (let j = 0; j <= vSegments; j++) {
      const v = vMin + (j / vSegments) * (vMax - vMin);
      surfaceGrid[i][j] = { u, v, pos: surfFunc(u, v) };
    }
  }

  function clamp(val, min, max) {
    return Math.min(Math.max(val, min), max);
  }

  function updateDot() {
    const pos = surfFunc(currentU, currentV);
    dot.position.copy(pos);
    if (typeof updateFunc === 'function') {
      updateFunc(currentU, currentV);
    }
  }

  updateDot();

  function getMouseRay(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
  }

  // Helper: find closest point on surface grid to ray (fast)
  function findClosestGridPoint(ray) {
    let closestDist = Infinity;
    let closestI = 0;
    let closestJ = 0;

    for (let i = 0; i <= uSegments; i++) {
      for (let j = 0; j <= vSegments; j++) {
        const pt = surfaceGrid[i][j].pos;
        const dist = ray.distanceSqToPoint(pt);
        if (dist < closestDist) {
          closestDist = dist;
          closestI = i;
          closestJ = j;
        }
      }
    }
    return { i: closestI, j: closestJ };
  }

  // Helper: refine u,v by local bilinear interpolation of the closest cell
  function refineUV(ray, i, j) {
    // Clamp neighbors for interpolation
    const i0 = clamp(i, 0, uSegments - 1);
    const j0 = clamp(j, 0, vSegments - 1);
    const i1 = clamp(i0 + 1, 0, uSegments);
    const j1 = clamp(j0 + 1, 0, vSegments);

    // Get the 4 corner points of the cell
    const p00 = surfaceGrid[i0][j0].pos;
    const p10 = surfaceGrid[i1][j0].pos;
    const p01 = surfaceGrid[i0][j1].pos;
    const p11 = surfaceGrid[i1][j1].pos;

    // For each corner, get squared distance to ray
    const d00 = ray.distanceSqToPoint(p00);
    const d10 = ray.distanceSqToPoint(p10);
    const d01 = ray.distanceSqToPoint(p01);
    const d11 = ray.distanceSqToPoint(p11);

    // Find weights inversely proportional to distances (adding epsilon to avoid div zero)
    const eps = 1e-8;
    const w00 = 1 / (d00 + eps);
    const w10 = 1 / (d10 + eps);
    const w01 = 1 / (d01 + eps);
    const w11 = 1 / (d11 + eps);
    const wSum = w00 + w10 + w01 + w11;

    // Weighted average of u and v coordinates
    const u =
      (surfaceGrid[i0][j0].u * w00 +
        surfaceGrid[i1][j0].u * w10 +
        surfaceGrid[i0][j1].u * w01 +
        surfaceGrid[i1][j1].u * w11) /
      wSum;
    const v =
      (surfaceGrid[i0][j0].v * w00 +
        surfaceGrid[i1][j0].v * w10 +
        surfaceGrid[i0][j1].v * w01 +
        surfaceGrid[i1][j1].v * w11) /
      wSum;

    return { u: clamp(u, uMin, uMax), v: clamp(v, vMin, vMax) };
  }

  let scheduled = false;
  let lastEvent = null;

  function processMouseMove() {
    if (!lastEvent || !isDragging) {
      scheduled = false;
      return;
    }
    getMouseRay(lastEvent);
    const { i, j } = findClosestGridPoint(raycaster.ray);
    const { u, v } = refineUV(raycaster.ray, i, j);

    currentU = u;
    currentV = v;
    updateDot();

    scheduled = false;
  }

  function onMouseDown(event) {
    getMouseRay(event);
    const intersects = raycaster.intersectObject(dot);
    if (intersects.length > 0) {
      isDragging = true;
      controls.enabled = false;
    }
  }

  function onMouseMove(event) {
    if (!isDragging) return;
    lastEvent = event;
    if (!scheduled) {
      scheduled = true;
      requestAnimationFrame(processMouseMove);
    }
  }

  function onMouseUp() {
    if (isDragging) {
      isDragging = false;
      controls.enabled = true;
    }
  }

  renderer.domElement.addEventListener('mousedown', onMouseDown);
  renderer.domElement.addEventListener('mousemove', onMouseMove);
  renderer.domElement.addEventListener('mouseup', onMouseUp);
  renderer.domElement.addEventListener('mouseleave', onMouseUp); // treat leaving as ending drag

  return {
    get u() { return currentU; },
    set u(value) {
      currentU = clamp(value, uMin, uMax);
      updateDot();
    },

    get v() { return currentV; },
    set v(value) {
      currentV = clamp(value, vMin, vMax);
      updateDot();
    },

    updateDot,

    destroy() {
      renderer.domElement.removeEventListener('mousedown', onMouseDown);
      renderer.domElement.removeEventListener('mousemove', onMouseMove);
      renderer.domElement.removeEventListener('mouseup', onMouseUp);
      renderer.domElement.removeEventListener('mouseleave', onMouseUp);
    }
  };
}

/**
 * Adds a LaTeX-rendered label into a THREE.js scene as a billboard sprite.
 * The label always faces the camera, and its pivot can be aligned by left, center, or right edge.
 *
 * @async
 * @param {THREE.Scene} scene - The THREE.js scene to add the label to.
 * @param {string} text - LaTeX code for the label (KaTeX-compatible).
 * @param {number} x - World X position of the label.
 * @param {number} y - World Y position of the label.
 * @param {number} z - World Z position of the label.
 * @param {object} [options={}] - Optional settings.
 * @param {string} [options.color="white"] - Text color.
 * @param {number} [options.size=1] - Scale factor for label size.
 * @param {"left"|"center"|"right"} [options.anchor="center"] - Which part of the text is anchored to (x,y,z).
 *
 * @returns {Promise<THREE.Object3D>} A container object holding the label sprite.
 * The container includes:
 *   - `.update(params)` to update properties ({ text, x, y, z, size, color, anchor }).
 *   - `.delete()` to remove and dispose resources.
 *
 * @example
 * const label = await addLatexLabel(scene, "\\alpha", 0, 1, 2, { color: "yellow", size: 2, anchor: "left" });
 * label.update({ text: "\\beta", x: 1 });
 * label.delete();
 */
export async function addLatexLabel(scene, text, x, y, z, options = {}) {
  let color = options.color || "white";
  let size = options.size || 1;
  let anchor = options.anchor || "left";

  async function renderLatexToCanvas(latexText) {
    const div = document.createElement("div");
    div.style.position = "absolute";
    div.style.color = color;
    div.style.fontSize = "24px";
    div.style.fontFamily = "KaTeX_Main, Times New Roman, serif";
    div.style.lineHeight = "1";
    div.style.whiteSpace = "nowrap";
    div.style.top = "-9999px";
    div.style.left = "-9999px";
    document.body.appendChild(div);

    try {
      katex.render(latexText, div, { throwOnError: false, displayMode: true });
    } catch (err) {
      console.error("KaTeX render error:", err);
      div.remove();
      return null;
    }

    const canvas = await html2canvas(div, {
      backgroundColor: null,
      useCORS: true,
      scale: 2,
    });

    div.remove();
    return canvas;
  }

  const canvas = await renderLatexToCanvas(text);
  if (!canvas) return null;

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;

  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });

  const sprite = new THREE.Sprite(material);

  const baseHeight = 0.3;
  const aspect = canvas.width / canvas.height;
  sprite.scale.set(baseHeight * aspect * size, baseHeight * size, 1);

  const container = new THREE.Object3D();
  container.add(sprite);
  container.position.set(x, y, z);
  scene.add(container);

  function applyAnchor() {
    if (anchor === "left") {
      sprite.center.set(0, 0.5); // pivot on left edge
    } else if (anchor === "right") {
      sprite.center.set(1, 0.5); // pivot on right edge
    } else {
      sprite.center.set(0.5, 0.5); // default center
    }
  }

  applyAnchor();

  let currentText = text;

  container.update = async ({
    text: newText,
    x: newX,
    y: newY,
    z: newZ,
    size: newSize,
    color: newColor,
    anchor: newAnchor,
  } = {}) => {
    let needsRerender = false;

    if (typeof newText === "string" && newText !== currentText) {
      currentText = newText;
      needsRerender = true;
    }
    if (typeof newColor === "string" && newColor !== color) {
      color = newColor;
      needsRerender = true;
    }
    if (typeof newAnchor === "string" && newAnchor !== anchor) {
      anchor = newAnchor;
      applyAnchor();
    }

    if (needsRerender) {
      const newCanvas = await renderLatexToCanvas(currentText);
      if (!newCanvas) return;

      sprite.material.map.dispose();
      sprite.material.map = new THREE.CanvasTexture(newCanvas);
      sprite.material.map.needsUpdate = true;

      const newAspect = newCanvas.width / newCanvas.height;
      const effectiveSize = typeof newSize === "number" ? newSize : size;
      sprite.scale.set(baseHeight * newAspect * effectiveSize, baseHeight * effectiveSize, 1);
      applyAnchor();
    }

    if (typeof newSize === "number" && newSize !== size) {
      size = newSize;
      const aspect = sprite.material.map.image.width / sprite.material.map.image.height;
      sprite.scale.set(baseHeight * aspect * size, baseHeight * size, 1);
      applyAnchor();
    }

    container.position.set(
      typeof newX === "number" ? newX : container.position.x,
      typeof newY === "number" ? newY : container.position.y,
      typeof newZ === "number" ? newZ : container.position.z
    );
  };

  container.delete = () => {
    scene.remove(container);
    if (sprite.material.map) sprite.material.map.dispose();
    sprite.material.dispose();
    sprite.geometry?.dispose?.();
  };

  return container;
}

/**
 * Adds a plain text label as a THREE.Sprite to a scene.
 * Returns the sprite with an async `update(text, x, y, z)` method.
 * 
 * @param {THREE.Scene} scene - The THREE.js scene to add the label to.
 * @param {string} text - Text to display.
 * @param {number} x - Initial x position.
 * @param {number} y - Initial y position.
 * @param {number} z - Initial z position.
 * @param {object} options - Optional settings: { color, size, font }.
 * @returns {THREE.Sprite} Sprite object with an `update()` method.
 */
export function addTextLabel(scene, text, x, y, z, options = {}) {
  const color = options.color || "white";
  const size = options.size || 1;
  const font = options.font || "24px sans-serif";
  const baseHeight = 0.3*size;

  function createTextCanvas(text) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    ctx.font = font;
    const textWidth = ctx.measureText(text).width;
    canvas.width = textWidth * 2;
    canvas.height = 64;

    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    return canvas;
  }

  const canvas = createTextCanvas(text);
  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;

  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });

  const sprite = new THREE.Sprite(material);
  sprite.renderOrder = 999;
  sprite.position.set(x, y, z);

  const aspect = canvas.width / canvas.height;
  sprite.scale.set(baseHeight * aspect, baseHeight, 1);
  scene.add(sprite);

  /**
   * Update the text content and/or position.
   * @param {string} newText - New text content.
   * @param {number} [newX=x] - New x position (optional).
   * @param {number} [newY=y] - New y position (optional).
   * @param {number} [newZ=z] - New z position (optional).
   */
  sprite.update = (newText, newX = x, newY = y, newZ = z) => {
    const newCanvas = createTextCanvas(newText);

    sprite.material.map.dispose();
    sprite.material.map = new THREE.CanvasTexture(newCanvas);
    sprite.material.map.needsUpdate = true;

    const newAspect = newCanvas.width / newCanvas.height;
    sprite.scale.set(baseHeight * newAspect, baseHeight, 1);
    sprite.position.set(newX, newY, newZ);
  };

  return sprite;
}

/**
 * Converts a 3D world position to 2D screen coordinates.
 *
 * This is useful when you want to overlay HTML elements (e.g., labels or tooltips)
 * on top of a THREE.js scene at positions that correspond to 3D objects.
 *
 * @param {THREE.Object3D|THREE.Vector3} target - The 3D object or position to project.
 * @param {THREE.Camera} camera - The active THREE.js camera.
 * @param {THREE.WebGLRenderer} renderer - The renderer, used to get the canvas size.
 * @returns {{ x: number, y: number }} The 2D screen coordinates in pixels (relative to top-left of canvas).
 *
 * @example
 * const screenPos = worldToScreenPosition(mesh, camera, renderer);
 * htmlLabel.style.left = `${screenPos.x}px`;
 * htmlLabel.style.top = `${screenPos.y}px`;
 */
export function worldToScreenPosition(target, camera, renderer) {
  const pos = target instanceof THREE.Vector3 ? target.clone() : target.position.clone();
  const projected = pos.project(camera);

  const widthHalf = renderer.domElement.clientWidth / 2;
  const heightHalf = renderer.domElement.clientHeight / 2;

  return {
    x: projected.x * widthHalf + widthHalf,
    y: -projected.y * heightHalf + heightHalf,
  };
}

/**
 * Adds a LaTeX-rendered HTML label fixed to the screen but anchored to a 3D world position.
 * The label stays in the same screen position relative to the camera's view of the target point.
 *
 * @param {string} text - The LaTeX string to render (KaTeX syntax).
 * @param {number} x - World-space x coordinate to anchor the label to.
 * @param {number} y - World-space y coordinate to anchor the label to.
 * @param {number} z - World-space z coordinate to anchor the label to.
 * @param {HTMLElement} container - The DOM container in which to append the label.
 * @param {THREE.Scene} scene - The THREE.js scene (not used but included for API consistency).
 * @param {THREE.Camera} camera - The THREE.js camera used to compute screen position.
 * @param {THREE.Renderer} renderer - The THREE.js renderer (needed to compute canvas size).
 * @param {Object} options - Optional settings: { color: string, size: number }
 * @returns {HTMLElement} The created label DOM element.
 */
export function addLatexScreenLabel(text, x, y, z, container, scene, camera, renderer, options = {}) {
  const color = options.color || "white";
  const size = options.size || 1;

  const labelDiv = document.createElement("div");
  labelDiv.className = "latex-label";
  labelDiv.style.position = "absolute";
  labelDiv.style.color = color;
  labelDiv.style.fontSize = `${20 * size}px`;
  labelDiv.style.pointerEvents = "none";
  labelDiv.style.whiteSpace = "nowrap";
  labelDiv.style.zIndex = 1000;
  labelDiv.style.transform = "translate(-50%, -50%)";

  try {
    katex.render(text, labelDiv, {
      throwOnError: false,
      displayMode: true, // set to false if you want inline rendering
    });
  } catch (err) {
    console.error("KaTeX render error:", err);
    labelDiv.textContent = text; // fallback
  }

  container.appendChild(labelDiv);

  const worldPos = new THREE.Vector3(x, y, z);
  const screenPos = new THREE.Vector3();

  function updateLabelPosition() {
    screenPos.copy(worldPos).project(camera);

    const halfWidth = renderer.domElement.clientWidth / 2;
    const halfHeight = renderer.domElement.clientHeight / 2;

    const screenX = screenPos.x * halfWidth + halfWidth;
    const screenY = -screenPos.y * halfHeight + halfHeight;

    labelDiv.style.left = `${screenX}px`;
    labelDiv.style.top = `${screenY}px`;

    // Hide label if behind camera
    const isVisible = screenPos.z >= -1 && screenPos.z <= 1;
    labelDiv.style.display = isVisible ? "block" : "none";
  }

  // Attach update method so user can call it in the render loop
  labelDiv.update = updateLabelPosition;

  // Initial position
  updateLabelPosition();

  return labelDiv;
}


/**
 * Sets the camera view for a 2D XY-plane view in Three.js (OrthographicCamera).
 * 
 * @param {THREE.OrbitControls} controls - OrbitControls instance
 * @param {THREE.OrthographicCamera} camera - The orthographic camera
 * @param {number} centerX - Desired center X coordinate
 * @param {number} centerY - Desired center Y coordinate
 * @param {number} zoomFactor - The desired zoom (e.g., 1 for default, 2 for zoom-in)
 */
export function set2DCameraView(controls, camera, centerX, centerY, zoomFactor = 1) {
  // Move camera to (centerX, centerY) in the XY plane
  const dz = camera.position.z; // keep current Z height

  camera.position.set(centerX, centerY, dz);
  controls.target.set(centerX, centerY, 0);

  // Set zoom (OrthographicCamera only)
  if ('zoom' in camera && typeof zoomFactor === 'number') {
    camera.zoom = zoomFactor;
    camera.updateProjectionMatrix();
  }

  controls.update();
}

/**
 * Inserts a picture into a 2D/3D scene with an orthographic camera.
 * The picture automatically fits the camera view while preserving aspect ratio
 * and updates on container resize.
 *
 * @param {THREE.Scene} scene - The THREE.js scene to add the image to.
 * @param {string} imageUrl - URL or path to the image.
 * @param {THREE.OrthographicCamera} camera - The camera viewing the scene.
 * @param {HTMLElement} container - DOM container of the renderer.
 * @returns {Promise<THREE.Mesh>} - Resolves with the plane mesh displaying the image.
 */
export async function insertPicture(scene, imageUrl, camera, container) {
  return new Promise((resolve, reject) => {
    const loader = new THREE.TextureLoader();
    loader.load(
      imageUrl,
      (texture) => {
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.needsUpdate = true;

        // Create plane geometry with initial 1x1 size
        const geometry = new THREE.PlaneGeometry(1, 1);
        const material = new THREE.MeshBasicMaterial({
          map: texture,
          transparent: false,
        });
        const plane = new THREE.Mesh(geometry, material);
        scene.add(plane);

        // Function to update plane scale & position to fit camera
        const resizePlane = () => {
          if (!camera || !container) return;

          const cw = container.clientWidth;
          const ch = container.clientHeight;
          if (cw === 0 || ch === 0) return;

          const aspectCamera = (camera.right - camera.left) / (camera.top - camera.bottom);
          const aspectImage = texture.image.width / texture.image.height;

          let scaleX, scaleY;

          // Fit maximally inside frustum
          if (aspectImage > aspectCamera) {
            scaleX = camera.right - camera.left;
            scaleY = scaleX / aspectImage;
          } else {
            scaleY = camera.top - camera.bottom;
            scaleX = scaleY * aspectImage;
          }

          plane.scale.set(scaleX, scaleY, 1);

          // Center the plane
          const centerX = (camera.left + camera.right) / 2;
          const centerY = (camera.top + camera.bottom) / 2;
          plane.position.set(centerX, centerY, camera.position.z - 0.5);
        };

        resizePlane();

        // Resize observer to update plane on container resize
        const observer = new ResizeObserver(() => {
          camera.updateProjectionMatrix();
          resizePlane();
        });
        observer.observe(container);

        // Add delete method for cleanup
        plane.delete = () => {
          scene.remove(plane);
          geometry.dispose();
          material.map?.dispose();
          material.dispose();
          observer.disconnect();
        };

        resolve(plane);
      },
      undefined,
      (err) => reject(err)
    );
  });
}

/**
 * Draws a dot on a 2D canvas context using a dot object.
 *
 * @param {Object} dot - An object representing the dot.
 * @param {number} dot.x - X coordinate of the dot.
 * @param {number} dot.y - Y coordinate of the dot.
 * @param {string} [dot.color='white'] - Color of the dot.
 * @param {number} [dot.radius=4] - Radius of the dot.
 * @param {CanvasRenderingContext2D} ctx - The canvas 2D rendering context.
 */
export function drawDot2D(dot, ctx) {
  const {
    x,
    y,
    color = 'white',
    radius = 4
  } = dot;

  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}

/**
 * Draw a line on a 2D canvas context.
 * @param {CanvasRenderingContext2D} ctx - The canvas 2D context.
 * @param {number} fromX - Starting X coordinate.
 * @param {number} fromY - Starting Y coordinate.
 * @param {number} toX - Ending X coordinate (tip of the arrow).
 * @param {number} toY - Ending Y coordinate (tip of the arrow).
 * @param {object} [options] - Optional styling parameters:
 *   - color: stroke/fill color (default: 'white')
 *   - lineWidth: line width (default: 2)
 *   - dotted: boolean to make the line dotted (default: false)
 */
export function drawLine2D(ctx, fromX, fromY, toX, toY, options = {}) {
  const {
    color = 'white',
    lineWidth = 2,
    dotted = false,
  } = options;

  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = lineWidth;

  // Apply dotted line pattern if needed
  if (dotted) {
    ctx.setLineDash([2, 4]); // 2px dash, 4px gap
  } else {
    ctx.setLineDash([]); // solid line
  }

  // Draw main line
  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.stroke();
  ctx.closePath();

  // Optional fill (not usually needed for lines)
  // ctx.fill(); // remove this unless you're drawing a shape

  // Reset line dash so it doesn't affect other drawings
  ctx.setLineDash([]);
}

/**
 * Draw a vector (line + arrowhead) on a 2D canvas context.
 * @param {CanvasRenderingContext2D} ctx - The canvas 2D context.
 * @param {number} fromX - Starting X coordinate.
 * @param {number} fromY - Starting Y coordinate.
 * @param {number} toX - Ending X coordinate (tip of the arrow).
 * @param {number} toY - Ending Y coordinate (tip of the arrow).
 * @param {object} [options] - Optional styling parameters:
 *   - color: stroke/fill color (default: 'white')
 *   - lineWidth: line width (default: 2)
 *   - arrowLength: length of the arrowhead (default: 10)
 *   - arrowAngle: angle between arrowhead sides in radians (default: Math.PI / 8)
 */
export function drawVector2D(ctx, fromX, fromY, toX, toY, options = {}) {
  const {
    color = 'white',
    lineWidth = 2,
    arrowLength = 10,
    arrowAngle = Math.PI / 8,
  } = options;

  // Calculate vector direction
  const dx = toX - fromX;
  const dy = toY - fromY;
  const angle = Math.atan2(dy, dx);

  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = lineWidth;

  // Draw main line
  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.stroke();

  // Draw arrowhead
  ctx.beginPath();
  ctx.moveTo(toX, toY);
  ctx.lineTo(
    toX - arrowLength * Math.cos(angle - arrowAngle),
    toY - arrowLength * Math.sin(angle - arrowAngle)
  );
  ctx.lineTo(
    toX - arrowLength * Math.cos(angle + arrowAngle),
    toY - arrowLength * Math.sin(angle + arrowAngle)
  );
  ctx.closePath();
  ctx.fill();
}

/**
 * Draws a mathematical function y = f(x) on a canvas, using relative bounds.
 * 
 * @param {CanvasRenderingContext2D} ctx - The canvas 2D rendering context.
 * @param {function(number): number} func - The function f(x) to plot.
 * @param {object} options - Configuration options:
 *   - xMin, xMax: World x-range to map into the plot area.
 *   - yMin, yMax: World y-range to map into the plot area.
 *   - leftBound, rightBound: Fractions (0–1) of canvas.width to define horizontal region.
 *   - lowBound, highBound: Fractions (0–1) of canvas.height to define vertical region.
 *   - color: Stroke color (default: 'white').
 *   - lineWidth: Line width (default: 2).
 *   - step: Sampling step size in pixels (default: 1).
 */
export function drawFunction2D(ctx, func, {
  xMin = -10,
  xMax = 10,
  yMin = -10,
  yMax = 10,
  leftBound = 0,
  rightBound = 1,
  lowBound = 0,
  highBound = 1,
  color = 'white',
  lineWidth = 2,
  step = 1
} = {}) {
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;

  const pxLeft = leftBound * width;
  const pxRight = rightBound * width;
  const pyTop = highBound * height;
  const pyBottom = lowBound * height;

  const pxWidth = pxRight - pxLeft;
  const pyHeight = pyBottom - pyTop;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;

  ctx.beginPath();
  let isFirstPoint = true;

  for (let px = pxLeft; px <= pxRight; px += step) {
    const x = xMin + ((px - pxLeft) / pxWidth) * (xMax - xMin);
    const y = func(x);

    if (!isFinite(y)) continue;

    // Map world y to canvas y within the bounding box (invert y-axis)
    const py = pyBottom - ((y - yMin) / (yMax - yMin)) * pyHeight;

    if (isFirstPoint) {
      ctx.moveTo(px, py);
      isFirstPoint = false;
    } else {
      ctx.lineTo(px, py);
    }
  }

  ctx.stroke();
  ctx.restore();
}