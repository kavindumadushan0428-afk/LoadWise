import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { LoadWiseModel, ModelAnimationState } from './LoadWiseModel';
import { CompartmentId, OledState, Garment } from '../types/loadwise';

export interface SceneCallbacks {
  onSelectCompartment?: (id: CompartmentId) => void;
  onKnobClick?: () => void;
}

export class LoadWiseSceneManager {
  private container: HTMLDivElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private model: LoadWiseModel;
  private animState: ModelAnimationState;

  // Camera Orbit & Damping
  private targetCameraPos: THREE.Vector3;
  private targetLookAt: THREE.Vector3;
  private currentLookAt: THREE.Vector3;
  private isPointerDown: boolean = false;
  private previousPointerPos: { x: number; y: number } = { x: 0, y: 0 };
  private spherical: THREE.Spherical;
  private targetSpherical: THREE.Spherical;

  // Raycasting
  private raycaster: THREE.Raycaster;
  private pointer: THREE.Vector2;
  private callbacks: SceneCallbacks;

  // Current model state storage
  private curCompartment: CompartmentId = 'colours';
  private curWeight: number = 2.6;
  private curOledState: OledState = 'HALF_LOAD';
  private curHumidity: number = 48;

  // Animation frame
  private animFrameId: number | null = null;
  private clock: THREE.Clock;
  private isDisposed: boolean = false;

  constructor(container: HTMLDivElement, callbacks: SceneCallbacks = {}) {
    this.container = container;
    this.callbacks = callbacks;
    this.clock = new THREE.Clock();

    // 1. WebGL Renderer
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true, // enables clean screenshot export!
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(this.renderer.domElement);

    // 2. Scene & Environment
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf3f2ef); // Neutral warm studio grey matching reference

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    // 3. Camera
    this.camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 50);
    this.spherical = new THREE.Spherical(5.2, Math.PI / 2.8, Math.PI / 5.2);
    this.targetSpherical = new THREE.Spherical().copy(this.spherical);

    this.currentLookAt = new THREE.Vector3(0, 0.95, 0);
    this.targetLookAt = new THREE.Vector3(0, 0.95, 0);
    this.targetCameraPos = new THREE.Vector3();
    this.updateCameraFromSpherical();

    // 4. Studio Lighting
    this.setupLighting();

    // 5. Build LoadWise Hamper Model
    this.model = new LoadWiseModel();
    this.scene.add(this.model.group);

    // 6. Animation State
    this.animState = {
      knobTargetAngle: 0,
      knobCurrentAngle: 0,
      isKnobPressed: false,
      linerLiftWhites: 0,
      linerLiftColours: 0,
      linerLiftDelicates: 0,
    };

    // 7. Raycasting & Interaction
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();

    this.initEventListeners();
    this.startLoop();
  }

  private setupLighting() {
    // Key Light (Warm soft directional light casting delicate shadows)
    const keyLight = new THREE.DirectionalLight(0xfffbf2, 2.2);
    keyLight.position.set(4, 7, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.bias = -0.0003;
    keyLight.shadow.normalBias = 0.02;
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 20;
    keyLight.shadow.camera.left = -3.5;
    keyLight.shadow.camera.right = 3.5;
    keyLight.shadow.camera.top = 3.5;
    keyLight.shadow.camera.bottom = -3.5;
    this.scene.add(keyLight);

    // Cool Fill Light (Soft subtle bounce)
    const fillLight = new THREE.DirectionalLight(0xdce7f0, 1.1);
    fillLight.position.set(-5, 4, 3);
    this.scene.add(fillLight);

    // Rim / Back Light (Gives gentle edge separation to top fabric rims)
    const rimLight = new THREE.DirectionalLight(0xffffff, 1.4);
    rimLight.position.set(0, 5, -5);
    this.scene.add(rimLight);

    // Ambient Hemisphere
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xe4e2dd, 0.85);
    this.scene.add(hemiLight);
  }

  private updateCameraFromSpherical() {
    this.spherical.radius = Math.max(2.0, Math.min(8.5, this.spherical.radius));
    this.spherical.phi = Math.max(0.12, Math.min(Math.PI / 2 + 0.1, this.spherical.phi)); // don't go below floor
    this.targetCameraPos.setFromSpherical(this.spherical).add(this.currentLookAt);
    this.camera.position.copy(this.targetCameraPos);
    this.camera.lookAt(this.currentLookAt);
  }

  public setViewPreset(preset: 'hero' | 'front' | 'rear' | 'top' | 'oled' | 'compartment') {
    switch (preset) {
      case 'hero': // Three-quarter Hero shot (matching photos 2 & 3)
        this.targetSpherical.radius = 5.2;
        this.targetSpherical.phi = Math.PI / 2.9;
        this.targetSpherical.theta = Math.PI / 5.2;
        this.targetLookAt.set(0, 0.95, 0);
        break;
      case 'front': // Front orthographic-style angle (matching photo 4)
        this.targetSpherical.radius = 4.7;
        this.targetSpherical.phi = Math.PI / 2.3;
        this.targetSpherical.theta = 0;
        this.targetLookAt.set(0, 1.0, 0);
        break;
      case 'rear': // Rear view (matching photo 1)
        this.targetSpherical.radius = 4.9;
        this.targetSpherical.phi = Math.PI / 2.4;
        this.targetSpherical.theta = Math.PI;
        this.targetLookAt.set(0, 0.95, 0);
        break;
      case 'top': // High-angle top looking into the 3 bins
        this.targetSpherical.radius = 4.2;
        this.targetSpherical.phi = 0.28;
        this.targetSpherical.theta = 0;
        this.targetLookAt.set(0, 0.9, 0);
        break;
      case 'oled': // Close-up on the OLED & tactile knob
        this.targetSpherical.radius = 2.4;
        this.targetSpherical.phi = Math.PI / 2.25;
        this.targetSpherical.theta = 0;
        this.targetLookAt.set(0, 0.82, 0.8);
        break;
      case 'compartment': // Angled view of the top fabric bins
        this.targetSpherical.radius = 3.6;
        this.targetSpherical.phi = Math.PI / 3.4;
        this.targetSpherical.theta = Math.PI / 8;
        this.targetLookAt.set(0, 1.2, 0);
        break;
    }
  }

  public updateModelData(
    selectedCompartment: CompartmentId,
    weight: number,
    oledState: OledState,
    humidity: number,
    knobAngle: number,
    isKnobPressed: boolean,
    compartmentGarments: Record<CompartmentId, Garment[]>,
    linerLiftStates: Record<CompartmentId, boolean>
  ) {
    this.curCompartment = selectedCompartment;
    this.curWeight = weight;
    this.curOledState = oledState;
    this.curHumidity = humidity;

    this.animState.knobTargetAngle = knobAngle;
    this.animState.isKnobPressed = isKnobPressed;
    this.animState.linerLiftWhites = linerLiftStates.whites ? 1 : 0;
    this.animState.linerLiftColours = linerLiftStates.colours ? 1 : 0;
    this.animState.linerLiftDelicates = linerLiftStates.delicates ? 1 : 0;

    (['whites', 'colours', 'delicates'] as CompartmentId[]).forEach((cid) => {
      this.model.updateClothesStack(cid, compartmentGarments[cid] || []);
    });
  }

  private initEventListeners() {
    const el = this.renderer.domElement;

    const onPointerDown = (e: PointerEvent) => {
      this.isPointerDown = true;
      this.previousPointerPos = { x: e.clientX, y: e.clientY };
      el.setPointerCapture(e.pointerId);

      // Check click/tap on 3D objects
      const rect = el.getBoundingClientRect();
      this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(this.pointer, this.camera);

      // 1. Check Knob Click
      const knobHits = this.raycaster.intersectObject(this.model.knobHitbox, true);
      if (knobHits.length > 0) {
        if (this.callbacks.onKnobClick) {
          this.callbacks.onKnobClick();
        }
        return;
      }

      // 2. Check Compartment Click
      const compBoxes = Object.values(this.model.compartmentHitboxes);
      const compHits = this.raycaster.intersectObjects(compBoxes, true);
      if (compHits.length > 0) {
        const hitObj = compHits[0].object;
        const cid = hitObj.userData.compartmentId as CompartmentId;
        if (cid && this.callbacks.onSelectCompartment) {
          this.callbacks.onSelectCompartment(cid);
        }
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      // Update cursor pointer if hovering knob or bins
      this.raycaster.setFromCamera(this.pointer, this.camera);
      const interactiveTargets = [
        this.model.knobHitbox,
        ...Object.values(this.model.compartmentHitboxes),
      ];
      const hits = this.raycaster.intersectObjects(interactiveTargets, true);
      el.style.cursor = hits.length > 0 ? 'pointer' : 'grab';

      if (!this.isPointerDown) return;
      el.style.cursor = 'grabbing';

      const dx = e.clientX - this.previousPointerPos.x;
      const dy = e.clientY - this.previousPointerPos.y;
      this.previousPointerPos = { x: e.clientX, y: e.clientY };

      const rotateSpeed = 0.005;
      this.targetSpherical.theta -= dx * rotateSpeed;
      this.targetSpherical.phi -= dy * rotateSpeed;
      this.targetSpherical.phi = Math.max(0.12, Math.min(Math.PI / 2 + 0.1, this.targetSpherical.phi));
    };

    const onPointerUp = (e: PointerEvent) => {
      this.isPointerDown = false;
      try {
        el.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
      el.style.cursor = 'grab';
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomSpeed = 0.002;
      this.targetSpherical.radius += e.deltaY * zoomSpeed;
      this.targetSpherical.radius = Math.max(2.0, Math.min(8.5, this.targetSpherical.radius));
    };

    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('pointermove', onPointerMove);
    el.addEventListener('pointerup', onPointerUp);
    el.addEventListener('pointercancel', onPointerUp);
    el.addEventListener('wheel', onWheel, { passive: false });

    // Window resize
    window.addEventListener('resize', this.handleResize);
  }

  private handleResize = () => {
    if (!this.container || this.isDisposed) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    if (w === 0 || h === 0) return;

    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  private startLoop() {
    const tick = () => {
      if (this.isDisposed) return;
      const delta = Math.min(0.1, this.clock.getDelta());

      // Smooth camera interpolation
      const dampFactor = Math.min(1, delta * 8);
      this.spherical.radius += (this.targetSpherical.radius - this.spherical.radius) * dampFactor;
      this.spherical.phi += (this.targetSpherical.phi - this.spherical.phi) * dampFactor;
      this.spherical.theta += (this.targetSpherical.theta - this.spherical.theta) * dampFactor;
      this.currentLookAt.lerp(this.targetLookAt, dampFactor);

      this.updateCameraFromSpherical();

      // Render model updates
      this.model.updateState(
        this.curCompartment,
        this.curWeight,
        this.curOledState,
        this.curHumidity,
        this.animState,
        delta
      );

      this.renderer.render(this.scene, this.camera);
      this.animFrameId = requestAnimationFrame(tick);
    };

    this.animFrameId = requestAnimationFrame(tick);
  }

  /**
   * Continuous sync hook from React animation loop
   */
  public renderFrame(
    selectedCompartment: CompartmentId,
    weight: number,
    oledState: OledState,
    humidity: number
  ) {
    const delta = 0.016;
    this.model.updateState(
      selectedCompartment,
      weight,
      oledState,
      humidity,
      this.animState,
      delta
    );
  }

  /**
   * Captures a high-resolution PNG screenshot of the current 3D canvas.
   */
  public takeScreenshot(): string {
    this.renderer.render(this.scene, this.camera);
    return this.renderer.domElement.toDataURL('image/png');
  }

  public dispose() {
    this.isDisposed = true;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
    }
    window.removeEventListener('resize', this.handleResize);
    this.model.dispose();
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}
