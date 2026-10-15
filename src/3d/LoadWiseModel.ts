import * as THREE from 'three';
import { CompartmentId, OledState, Garment } from '../types/loadwise';
import { createFabricTexture, OledCanvasRenderer } from './textureGenerator';

export interface ModelAnimationState {
  knobTargetAngle: number;
  knobCurrentAngle: number;
  isKnobPressed: boolean;
  linerLiftWhites: number;
  linerLiftColours: number;
  linerLiftDelicates: number;
}

export class LoadWiseModel {
  public group: THREE.Group;
  public oledRenderer: OledCanvasRenderer;
  public knobMeshGroup: THREE.Group;
  public knobHitbox: THREE.Mesh;
  public compartmentHitboxes: Record<CompartmentId, THREE.Mesh>;

  // Liners
  private linerGroups: Record<CompartmentId, THREE.Group>;
  private clothesGroups: Record<CompartmentId, THREE.Group>;

  // LEDs
  private ledMaterials: Record<CompartmentId, THREE.MeshStandardMaterial>;

  // Materials for disposal
  private materialsToDispose: THREE.Material[] = [];
  private geometriesToDispose: THREE.BufferGeometry[] = [];

  constructor() {
    this.group = new THREE.Group();
    this.oledRenderer = new OledCanvasRenderer();

    // Initialize hitboxes & references
    this.knobMeshGroup = new THREE.Group();
    this.knobHitbox = null as unknown as THREE.Mesh;
    this.compartmentHitboxes = {} as Record<CompartmentId, THREE.Mesh>;
    this.linerGroups = {} as Record<CompartmentId, THREE.Group>;
    this.clothesGroups = {} as Record<CompartmentId, THREE.Group>;
    this.ledMaterials = {} as Record<CompartmentId, THREE.MeshStandardMaterial>;

    this.buildModel();
  }

  private buildModel() {
    // Primary dimensions matching reference images:
    // W = 4.0, H = 2.05, D = 1.75
    const bodyWidth = 4.0;
    const bodyHeight = 1.6;
    const bodyDepth = 1.72;
    const baseHeight = 0.45;
    const totalHeight = bodyHeight + baseHeight;
    const cornerRadius = 0.28;

    // 1. CHARCOAL LOWER BASE
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x272b30,
      roughness: 0.65,
      metalness: 0.15,
    });
    this.materialsToDispose.push(baseMat);

    // Rounded rectangle shape for base
    const baseShape = this.createRoundedRectShape(bodyWidth, bodyDepth, cornerRadius);
    const baseExtrudeSettings = {
      depth: baseHeight,
      bevelEnabled: true,
      bevelSegments: 6,
      steps: 1,
      bevelSize: 0.04,
      bevelThickness: 0.04,
    };
    const baseGeo = new THREE.ExtrudeGeometry(baseShape, baseExtrudeSettings);
    baseGeo.center();
    this.geometriesToDispose.push(baseGeo);

    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.rotation.x = Math.PI / 2;
    baseMesh.position.y = baseHeight / 2;
    baseMesh.castShadow = true;
    baseMesh.receiveShadow = true;
    this.group.add(baseMesh);

    // Rubber feet at bottom corners
    const footMat = new THREE.MeshStandardMaterial({ color: 0x111315, roughness: 0.9 });
    this.materialsToDispose.push(footMat);
    const footPositions = [
      [-bodyWidth / 2 + 0.35, 0.04, -bodyDepth / 2 + 0.3],
      [bodyWidth / 2 - 0.35, 0.04, -bodyDepth / 2 + 0.3],
      [-bodyWidth / 2 + 0.35, 0.04, bodyDepth / 2 - 0.3],
      [bodyWidth / 2 - 0.35, 0.04, bodyDepth / 2 - 0.3],
    ];
    footPositions.forEach(([fx, fy, fz]) => {
      const footGeo = new THREE.CylinderGeometry(0.12, 0.14, 0.08, 16);
      this.geometriesToDispose.push(footGeo);
      const foot = new THREE.Mesh(footGeo, footMat);
      foot.position.set(fx, fy, fz);
      this.group.add(foot);
    });

    // Embossed "LOADWISE" front wordmark on base
    const wordmarkTexture = this.createWordmarkTexture();
    const wordmarkMat = new THREE.MeshBasicMaterial({
      map: wordmarkTexture,
      transparent: true,
      opacity: 0.65,
    });
    this.materialsToDispose.push(wordmarkMat);
    const wordmarkGeo = new THREE.PlaneGeometry(0.9, 0.18);
    this.geometriesToDispose.push(wordmarkGeo);
    const wordmarkMesh = new THREE.Mesh(wordmarkGeo, wordmarkMat);
    wordmarkMesh.position.set(0, baseHeight * 0.48, bodyDepth / 2 + 0.05);
    this.group.add(wordmarkMesh);

    // Rear Details on Base: IEC C14 power inlet & ventilation
    this.buildRearBaseDetails(bodyDepth, baseHeight);

    // 2. MAIN WARM-WHITE POLYMER HOUSING
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0xedeae3, // Warm matte off-white matching reference
      roughness: 0.42,
      metalness: 0.06,
    });
    this.materialsToDispose.push(bodyMat);

    // Outer shell shape with 3 hollow bay cutouts
    const bodyShape = this.createRoundedRectShape(bodyWidth, bodyDepth, cornerRadius);
    const compXPositions: Record<CompartmentId, number> = {
      whites: -1.2,
      colours: 0.0,
      delicates: 1.2,
    };
    const compWidth = 1.05;
    const compDepth = 1.38;
    const compHeight = 1.32;

    // Add 3 open bays into the top/body extrusion
    bodyShape.holes.push(this.createHole(-1.2, 0, compWidth, compDepth, 0.08));
    bodyShape.holes.push(this.createHole(0.0, 0, compWidth, compDepth, 0.08));
    bodyShape.holes.push(this.createHole(1.2, 0, compWidth, compDepth, 0.08));

    const bodyExtrudeSettings = {
      depth: bodyHeight,
      bevelEnabled: true,
      bevelSegments: 4,
      steps: 1,
      bevelSize: 0.03,
      bevelThickness: 0.03,
    };
    const bodyGeo = new THREE.ExtrudeGeometry(bodyShape, bodyExtrudeSettings);
    bodyGeo.center();
    this.geometriesToDispose.push(bodyGeo);

    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.rotation.x = Math.PI / 2;
    bodyMesh.position.y = baseHeight + bodyHeight / 2;
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    this.group.add(bodyMesh);

    // Recessed side carry handles (left & right)
    this.buildSideHandles(bodyWidth, bodyHeight, baseHeight);

    // Screws on top corners
    this.buildCornerScrews(bodyWidth, totalHeight, bodyDepth);

    // 3. TOP DECK & THREE INNER COMPARTMENTS
    // Divider walls between compartments
    const dividerMat = new THREE.MeshStandardMaterial({
      color: 0xe5e1d8,
      roughness: 0.5,
      metalness: 0.05,
    });
    this.materialsToDispose.push(dividerMat);

    [-0.6, 0.6].forEach((dx) => {
      const dividerGeo = new THREE.BoxGeometry(0.04, 0.15, compDepth + 0.15);
      this.geometriesToDispose.push(dividerGeo);
      const divider = new THREE.Mesh(dividerGeo, dividerMat);
      divider.position.set(dx, totalHeight - 0.04, 0);
      this.group.add(divider);
    });

    // Build the 3 Removable Fabric Liners
    (['whites', 'colours', 'delicates'] as CompartmentId[]).forEach((cid) => {
      const cx = compXPositions[cid];
      const linerGroup = new THREE.Group();
      linerGroup.position.set(cx, totalHeight - 0.02, 0);

      const fabricColor =
        cid === 'whites' ? '#EAE5DB' : cid === 'colours' ? '#587487' : '#D0929D';
      const fabricTexture = createFabricTexture(fabricColor);

      const fabricMat = new THREE.MeshStandardMaterial({
        map: fabricTexture,
        roughness: 0.88,
        metalness: 0.02,
        side: THREE.DoubleSide,
      });
      this.materialsToDispose.push(fabricMat);

      // Deep cloth interior bag with OPEN TOP
      const bagGeo = new THREE.BoxGeometry(compWidth - 0.06, compHeight, compDepth - 0.06);
      this.geometriesToDispose.push(bagGeo);
      const invisibleTopMat = new THREE.MeshBasicMaterial({ visible: false });
      this.materialsToDispose.push(invisibleTopMat);
      const openBagMaterials = [
        fabricMat, // right +X
        fabricMat, // left -X
        invisibleTopMat, // top +Y (OPEN)
        fabricMat, // bottom -Y
        fabricMat, // front +Z
        fabricMat, // back -Z
      ];
      const bagMesh = new THREE.Mesh(bagGeo, openBagMaterials);
      bagMesh.position.y = -compHeight / 2;
      linerGroup.add(bagMesh);

      // Rolled fabric collar / rim folded over the top border (characteristic of the reference photo)
      const rimShape = this.createRoundedHollowRect(compWidth + 0.02, compDepth + 0.02, 0.08, 0.12);
      const rimGeo = new THREE.ExtrudeGeometry(rimShape, {
        depth: 0.09,
        bevelEnabled: true,
        bevelSegments: 4,
        bevelSize: 0.03,
        bevelThickness: 0.03,
      });
      rimGeo.center();
      this.geometriesToDispose.push(rimGeo);
      const rimMesh = new THREE.Mesh(rimGeo, fabricMat);
      rimMesh.rotation.x = Math.PI / 2;
      rimMesh.position.y = 0.02;
      linerGroup.add(rimMesh);

      // Fabric handles / grip loops for lifting
      const handleMat = new THREE.MeshStandardMaterial({
        color: cid === 'whites' ? 0xdad3c5 : cid === 'colours' ? 0x476273 : 0xbd7d89,
        roughness: 0.9,
      });
      this.materialsToDispose.push(handleMat);
      const handleGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.28, 12);
      this.geometriesToDispose.push(handleGeo);

      const handle1 = new THREE.Mesh(handleGeo, handleMat);
      handle1.rotation.z = Math.PI / 2;
      handle1.position.set(0, 0.06, -compDepth / 2 + 0.05);
      linerGroup.add(handle1);

      const handle2 = new THREE.Mesh(handleGeo, handleMat);
      handle2.rotation.z = Math.PI / 2;
      handle2.position.set(0, 0.06, compDepth / 2 - 0.05);
      linerGroup.add(handle2);

      // Clothes stack container inside this liner
      const clothesGroup = new THREE.Group();
      clothesGroup.position.set(0, -compHeight + 0.12, 0);
      linerGroup.add(clothesGroup);
      this.clothesGroups[cid] = clothesGroup;

      this.group.add(linerGroup);
      this.linerGroups[cid] = linerGroup;

      // Clickable hitbox for compartment selection
      const hitGeo = new THREE.BoxGeometry(compWidth, 0.4, compDepth);
      this.geometriesToDispose.push(hitGeo);
      const hitMat = new THREE.MeshBasicMaterial({ visible: false });
      const hitbox = new THREE.Mesh(hitGeo, hitMat);
      hitbox.position.set(cx, totalHeight + 0.1, 0);
      hitbox.userData = { compartmentId: cid };
      this.group.add(hitbox);
      this.compartmentHitboxes[cid] = hitbox;
    });

    // 4. FRONT LABELS AND EMISSIVE LED LIGHTS
    this.buildFrontLabelsAndLEDs(compXPositions, totalHeight, bodyDepth);

    // 5. OLED DISPLAY & CONTROL CONSOLE
    this.buildOledDisplay(totalHeight, bodyDepth);

    // 6. ROTARY CONTROL KNOB
    this.buildRotaryKnob(totalHeight, bodyDepth);

    // 7. CONTACT SHADOW PLANE
    this.buildContactShadow(bodyWidth, bodyDepth);
  }

  private buildRearBaseDetails(bodyDepth: number, baseHeight: number) {
    const rearZ = -bodyDepth / 2 - 0.04;

    // Centered IEC C14 Power Inlet Socket
    const socketHousingGeo = new THREE.BoxGeometry(0.36, 0.24, 0.06);
    this.geometriesToDispose.push(socketHousingGeo);
    const socketHousingMat = new THREE.MeshStandardMaterial({
      color: 0x17191c,
      roughness: 0.8,
    });
    this.materialsToDispose.push(socketHousingMat);
    const socketMesh = new THREE.Mesh(socketHousingGeo, socketHousingMat);
    socketMesh.position.set(0, baseHeight * 0.48, rearZ);
    this.group.add(socketMesh);

    // Inner IEC pin socket recess
    const socketInnerGeo = new THREE.BoxGeometry(0.2, 0.12, 0.04);
    this.geometriesToDispose.push(socketInnerGeo);
    const socketInnerMat = new THREE.MeshStandardMaterial({ color: 0x08090a, roughness: 0.9 });
    this.materialsToDispose.push(socketInnerMat);
    const innerMesh = new THREE.Mesh(socketInnerGeo, socketInnerMat);
    innerMesh.position.set(0, baseHeight * 0.48, rearZ - 0.02);
    this.group.add(innerMesh);

    // Flanking rear ventilation slots (horizontal slats matching rear photo)
    const ventMat = new THREE.MeshBasicMaterial({ color: 0x121417 });
    this.materialsToDispose.push(ventMat);
    [-1.05, 1.05].forEach((vx) => {
      for (let i = 0; i < 4; i++) {
        const slotGeo = new THREE.BoxGeometry(0.85, 0.032, 0.02);
        this.geometriesToDispose.push(slotGeo);
        const slot = new THREE.Mesh(slotGeo, ventMat);
        slot.position.set(vx, baseHeight * 0.28 + i * 0.075, rearZ);
        this.group.add(slot);
      }
    });
  }

  private buildSideHandles(bodyWidth: number, bodyHeight: number, baseHeight: number) {
    const handleRecessMat = new THREE.MeshStandardMaterial({
      color: 0x22262a,
      roughness: 0.7,
      metalness: 0.1,
    });
    this.materialsToDispose.push(handleRecessMat);

    const handleShape = this.createRoundedRectShape(0.48, 0.22, 0.09);
    const handleGeo = new THREE.ExtrudeGeometry(handleShape, {
      depth: 0.06,
      bevelEnabled: true,
      bevelSegments: 4,
      bevelSize: 0.02,
      bevelThickness: 0.02,
    });
    handleGeo.center();
    this.geometriesToDispose.push(handleGeo);

    // Left Handle
    const leftHandle = new THREE.Mesh(handleGeo, handleRecessMat);
    leftHandle.rotation.y = Math.PI / 2;
    leftHandle.position.set(-bodyWidth / 2 - 0.02, baseHeight + bodyHeight * 0.76, 0);
    this.group.add(leftHandle);

    // Right Handle
    const rightHandle = new THREE.Mesh(handleGeo, handleRecessMat);
    rightHandle.rotation.y = -Math.PI / 2;
    rightHandle.position.set(bodyWidth / 2 + 0.02, baseHeight + bodyHeight * 0.76, 0);
    this.group.add(rightHandle);
  }

  private buildCornerScrews(bodyWidth: number, totalHeight: number, bodyDepth: number) {
    const screwMat = new THREE.MeshStandardMaterial({
      color: 0x7c8590,
      metalness: 0.85,
      roughness: 0.2,
    });
    this.materialsToDispose.push(screwMat);

    // 4 screws on top divider corners matching the photo
    const screwPositions = [
      [-bodyWidth / 2 + 0.18, totalHeight - 0.015, -bodyDepth / 2 + 0.18],
      [bodyWidth / 2 - 0.18, totalHeight - 0.015, -bodyDepth / 2 + 0.18],
      [-bodyWidth / 2 + 0.18, totalHeight - 0.015, bodyDepth / 2 - 0.18],
      [bodyWidth / 2 - 0.18, totalHeight - 0.015, bodyDepth / 2 - 0.18],
    ];

    screwPositions.forEach(([sx, sy, sz]) => {
      const screwGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.01, 12);
      this.geometriesToDispose.push(screwGeo);
      const screw = new THREE.Mesh(screwGeo, screwMat);
      screw.position.set(sx, sy, sz);
      this.group.add(screw);
    });
  }

  private buildFrontLabelsAndLEDs(
    compXPositions: Record<CompartmentId, number>,
    totalHeight: number,
    bodyDepth: number
  ) {
    const frontZ = bodyDepth / 2 + 0.045;
    const labelConfigs: Record<CompartmentId, { label: string; ledColor: number; ledY: number; labelY: number }> = {
      whites: { label: 'WHITES', ledColor: 0xffffff, labelY: totalHeight - 0.38, ledY: totalHeight - 0.44 },
      colours: { label: 'COLOURS', ledColor: 0x38bdf8, labelY: totalHeight - 0.32, ledY: totalHeight - 0.38 },
      delicates: { label: 'DELICATES', ledColor: 0xf472b6, labelY: totalHeight - 0.38, ledY: totalHeight - 0.44 },
    };

    (['whites', 'colours', 'delicates'] as CompartmentId[]).forEach((cid) => {
      const conf = labelConfigs[cid];
      const cx = compXPositions[cid];

      // Printed Text Label
      const labelTexture = this.createLabelTexture(conf.label);
      const labelMat = new THREE.MeshBasicMaterial({
        map: labelTexture,
        transparent: true,
        opacity: 0.85,
      });
      this.materialsToDispose.push(labelMat);
      const labelGeo = new THREE.PlaneGeometry(0.5, 0.1);
      this.geometriesToDispose.push(labelGeo);
      const labelMesh = new THREE.Mesh(labelGeo, labelMat);
      labelMesh.position.set(cx, conf.labelY, frontZ);
      this.group.add(labelMesh);

      // Horizontal Emissive LED Light Bar
      const ledGeo = new THREE.BoxGeometry(0.18, 0.022, 0.015);
      this.geometriesToDispose.push(ledGeo);
      const ledMat = new THREE.MeshStandardMaterial({
        color: conf.ledColor,
        emissive: conf.ledColor,
        emissiveIntensity: cid === 'colours' ? 1.6 : 0.6,
        roughness: 0.2,
      });
      this.materialsToDispose.push(ledMat);
      this.ledMaterials[cid] = ledMat;

      const ledMesh = new THREE.Mesh(ledGeo, ledMat);
      ledMesh.position.set(cx, conf.ledY, frontZ + 0.005);
      this.group.add(ledMesh);
    });
  }

  private buildOledDisplay(totalHeight: number, bodyDepth: number) {
    const oledWidth = 0.62;
    const oledHeight = 1.04;
    const oledZ = bodyDepth / 2 + 0.046;
    const oledY = totalHeight - 0.98;

    // Dark glossy glass bezel frame
    const bezelGeo = new THREE.BoxGeometry(oledWidth + 0.05, oledHeight + 0.05, 0.03);
    this.geometriesToDispose.push(bezelGeo);
    const bezelMat = new THREE.MeshStandardMaterial({
      color: 0x050608,
      metalness: 0.85,
      roughness: 0.1,
    });
    this.materialsToDispose.push(bezelMat);
    const bezelMesh = new THREE.Mesh(bezelGeo, bezelMat);
    bezelMesh.position.set(0, oledY, oledZ - 0.01);
    this.group.add(bezelMesh);

    // Active OLED Screen Surface mapped with CanvasTexture
    const screenGeo = new THREE.PlaneGeometry(oledWidth, oledHeight);
    this.geometriesToDispose.push(screenGeo);
    const screenMat = new THREE.MeshBasicMaterial({
      map: this.oledRenderer.texture,
    });
    this.materialsToDispose.push(screenMat);

    const screenMesh = new THREE.Mesh(screenGeo, screenMat);
    screenMesh.position.set(0, oledY, oledZ + 0.008);
    this.group.add(screenMesh);
  }

  private buildRotaryKnob(totalHeight: number, bodyDepth: number) {
    const knobRadius = 0.18;
    const knobDepth = 0.07;
    const knobY = totalHeight - 1.28;
    const knobZ = bodyDepth / 2 + 0.06;

    this.knobMeshGroup.position.set(0, knobY, knobZ);

    // Outer knurled / bevel metallic ring
    const ringGeo = new THREE.CylinderGeometry(knobRadius, knobRadius, knobDepth, 32);
    this.geometriesToDispose.push(ringGeo);
    const knobMetalMat = new THREE.MeshStandardMaterial({
      color: 0x1f2327,
      metalness: 0.95,
      roughness: 0.22,
    });
    this.materialsToDispose.push(knobMetalMat);

    const ringMesh = new THREE.Mesh(ringGeo, knobMetalMat);
    ringMesh.rotation.x = Math.PI / 2;
    ringMesh.castShadow = true;
    this.knobMeshGroup.add(ringMesh);

    // Chamfered front metallic rim
    const chamferGeo = new THREE.TorusGeometry(knobRadius - 0.015, 0.012, 16, 32);
    this.geometriesToDispose.push(chamferGeo);
    const chamferMat = new THREE.MeshStandardMaterial({
      color: 0x8a929b,
      metalness: 0.98,
      roughness: 0.12,
    });
    this.materialsToDispose.push(chamferMat);
    const chamferMesh = new THREE.Mesh(chamferGeo, chamferMat);
    chamferMesh.position.z = knobDepth / 2;
    this.knobMeshGroup.add(chamferMesh);

    // Sunken brushed circular face
    const capGeo = new THREE.CircleGeometry(knobRadius - 0.02, 32);
    this.geometriesToDispose.push(capGeo);
    const capMat = new THREE.MeshStandardMaterial({
      color: 0x15181b,
      metalness: 0.88,
      roughness: 0.28,
    });
    this.materialsToDispose.push(capMat);
    const capMesh = new THREE.Mesh(capGeo, capMat);
    capMesh.position.z = knobDepth / 2 + 0.005;
    this.knobMeshGroup.add(capMesh);

    // Subtle pointer notch line on knob face
    const notchGeo = new THREE.BoxGeometry(0.012, 0.065, 0.004);
    this.geometriesToDispose.push(notchGeo);
    const notchMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0x38bdf8,
      emissiveIntensity: 0.8,
    });
    this.materialsToDispose.push(notchMat);
    const notch = new THREE.Mesh(notchGeo, notchMat);
    notch.position.set(0, knobRadius * 0.52, knobDepth / 2 + 0.008);
    this.knobMeshGroup.add(notch);

    this.group.add(this.knobMeshGroup);

    // Interactive Invisible Hitbox for Mouse/Pointer Dragging & Clicking
    const knobHitGeo = new THREE.CylinderGeometry(knobRadius + 0.08, knobRadius + 0.08, 0.15, 16);
    this.geometriesToDispose.push(knobHitGeo);
    const knobHitMat = new THREE.MeshBasicMaterial({ visible: false });
    this.knobHitbox = new THREE.Mesh(knobHitGeo, knobHitMat);
    this.knobHitbox.rotation.x = Math.PI / 2;
    this.knobHitbox.position.set(0, knobY, knobZ);
    this.knobHitbox.userData = { isKnob: true };
    this.group.add(this.knobHitbox);
  }

  private buildContactShadow(bodyWidth: number, bodyDepth: number) {
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 256;
    shadowCanvas.height = 256;
    const sctx = shadowCanvas.getContext('2d')!;

    const grad = sctx.createRadialGradient(128, 128, 20, 128, 128, 120);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.42)');
    grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.18)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    sctx.fillStyle = grad;
    sctx.fillRect(0, 0, 256, 256);

    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const shadowGeo = new THREE.PlaneGeometry(bodyWidth * 1.35, bodyDepth * 1.45);
    this.geometriesToDispose.push(shadowGeo);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.75,
    });
    this.materialsToDispose.push(shadowMat);

    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = 0.002;
    this.group.add(shadowMesh);
  }

  /**
   * Rebuilds the visual 3D garments stacked inside the specified compartment.
   */
  public updateClothesStack(cid: CompartmentId, garments: Garment[]) {
    const group = this.clothesGroups[cid];
    if (!group) return;

    // Clear old garments
    while (group.children.length > 0) {
      const child = group.children[0] as THREE.Mesh;
      group.remove(child);
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    }

    // Spawn 3D garment cushions stacked with slight organic offsets
    garments.forEach((g, idx) => {
      const gWidth = 0.72 + (idx % 3) * 0.08;
      const gDepth = 0.95 + ((idx * 2) % 3) * 0.08;
      const gHeight = 0.18 + Math.min(0.12, g.weight * 0.12);

      const shape = this.createRoundedRectShape(gWidth, gDepth, 0.16);
      const extrudeGeo = new THREE.ExtrudeGeometry(shape, {
        depth: gHeight,
        bevelEnabled: true,
        bevelSegments: 4,
        bevelSize: 0.05,
        bevelThickness: 0.05,
      });
      extrudeGeo.center();

      const mat = new THREE.MeshStandardMaterial({
        color: g.color,
        roughness: 0.85,
        metalness: 0.05,
      });

      const mesh = new THREE.Mesh(extrudeGeo, mat);
      mesh.rotation.x = Math.PI / 2;
      mesh.rotation.z = ((idx * 47) % 30 - 15) * (Math.PI / 180); // organic slight rotation
      mesh.position.set(
        ((idx * 13) % 20 - 10) * 0.012,
        idx * 0.22 + 0.22,
        ((idx * 29) % 20 - 10) * 0.012
      );
      mesh.castShadow = true;
      group.add(mesh);
    });
  }

  /**
   * Updates dynamic LED colors, OLED screen state, and rotary knob animation.
   */
  public updateState(
    selectedCompartment: CompartmentId,
    weight: number,
    state: OledState,
    humidity: number,
    anim: ModelAnimationState,
    delta: number
  ) {
    // 1. Update OLED Screen Texture
    this.oledRenderer.render(selectedCompartment, weight, state, humidity);

    // 2. Smoothly rotate Knob with damping
    const angleDiff = anim.knobTargetAngle - anim.knobCurrentAngle;
    anim.knobCurrentAngle += angleDiff * Math.min(1, delta * 14);
    this.knobMeshGroup.rotation.z = -anim.knobCurrentAngle;

    // Knob press depth feedback
    const targetZ = anim.isKnobPressed ? 0.93 - 0.015 : 0.93;
    this.knobMeshGroup.position.z += (targetZ - this.knobMeshGroup.position.z) * 0.3;

    // 3. Update LEDs (Color and Glow Intensity)
    (['whites', 'colours', 'delicates'] as CompartmentId[]).forEach((cid) => {
      const ledMat = this.ledMaterials[cid];
      if (!ledMat) return;

      const isSelected = cid === selectedCompartment;
      let targetColor = cid === 'whites' ? 0xffffff : cid === 'colours' ? 0x38bdf8 : 0xf472b6;
      let targetIntensity = isSelected ? 1.8 : 0.45;

      if (isSelected) {
        if (state === 'OVERLOAD') {
          targetColor = 0xff3b30;
          targetIntensity = 2.4;
        } else if (state === 'POSSIBLE_DAMP') {
          targetColor = 0xff9f0a;
          targetIntensity = 2.0;
        } else if (state === 'WASH_NOW') {
          targetColor = 0x34c759;
          targetIntensity = 2.2;
        }
      }

      ledMat.color.setHex(targetColor);
      ledMat.emissive.setHex(targetColor);
      ledMat.emissiveIntensity = targetIntensity;
    });

    // 4. Update Liner Vertical Lift Animations
    const lifts: Record<CompartmentId, number> = {
      whites: anim.linerLiftWhites,
      colours: anim.linerLiftColours,
      delicates: anim.linerLiftDelicates,
    };
    const totalHeight = 1.6 + 0.45;

    (['whites', 'colours', 'delicates'] as CompartmentId[]).forEach((cid) => {
      const liner = this.linerGroups[cid];
      if (!liner) return;
      const targetY = totalHeight - 0.02 + lifts[cid] * 1.5;
      liner.position.y += (targetY - liner.position.y) * Math.min(1, delta * 8);
    });
  }

  // --- Helpers for Geometry & Textures ---

  private createRoundedRectShape(w: number, h: number, r: number): THREE.Shape {
    const shape = new THREE.Shape();
    const x = -w / 2;
    const y = -h / 2;
    shape.moveTo(x + r, y);
    shape.lineTo(x + w - r, y);
    shape.quadraticCurveTo(x + w, y, x + w, y + r);
    shape.lineTo(x + w, y + h - r);
    shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    shape.lineTo(x + r, y + h);
    shape.quadraticCurveTo(x, y + h, x, y + h - r);
    shape.lineTo(x, y + r);
    shape.quadraticCurveTo(x, y, x + r, y);
    return shape;
  }

  private createRoundedHollowRect(w: number, h: number, thickness: number, r: number): THREE.Shape {
    const outer = this.createRoundedRectShape(w, h, r);
    const inner = this.createRoundedRectShape(w - thickness * 2, h - thickness * 2, Math.max(0.01, r - thickness));
    outer.holes.push(inner);
    return outer;
  }

  private createHole(cx: number, cy: number, w: number, h: number, r: number): THREE.Path {
    const hole = new THREE.Path();
    const x = cx - w / 2;
    const y = cy - h / 2;
    hole.moveTo(x + r, y);
    hole.lineTo(x + w - r, y);
    hole.quadraticCurveTo(x + w, y, x + w, y + r);
    hole.lineTo(x + w, y + h - r);
    hole.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    hole.lineTo(x + r, y + h);
    hole.quadraticCurveTo(x, y + h, x, y + h - r);
    hole.lineTo(x, y + r);
    hole.quadraticCurveTo(x, y, x + r, y);
    return hole;
  }

  private createWordmarkTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;

    ctx.clearRect(0, 0, 512, 128);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#9CA3AF'; // Light silver grey
    ctx.font = '700 50px "Plus Jakarta Sans", sans-serif';
    ctx.letterSpacing = '12px';
    ctx.fillText('LOADWISE', 256, 64);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 16;
    return texture;
  }

  private createLabelTexture(text: string): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;

    ctx.clearRect(0, 0, 512, 128);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#2D3748'; // Rich dark charcoal matching photo
    ctx.font = '700 52px "Plus Jakarta Sans", sans-serif';
    ctx.letterSpacing = '10px';
    ctx.fillText(text, 256, 64);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 16;
    return texture;
  }

  public dispose() {
    this.geometriesToDispose.forEach((g) => g.dispose());
    this.materialsToDispose.forEach((m) => m.dispose());
  }
}
