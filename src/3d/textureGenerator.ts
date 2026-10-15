import * as THREE from 'three';
import { CompartmentId, OledState } from '../types/loadwise';

/**
 * Creates a seamless fabric micro-weave normal/bump pattern.
 */
export function createFabricTexture(baseColorHex: string): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Fill base color
  ctx.fillStyle = baseColorHex;
  ctx.fillRect(0, 0, size, size);

  // Woven twill / cross pattern
  const imgData = ctx.getImageData(0, 0, size, size);
  const data = imgData.data;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      // Procedural criss-cross weave
      const weave1 = Math.sin((x + y) * 0.45) * 0.5 + 0.5;
      const weave2 = Math.cos((x - y) * 0.45) * 0.5 + 0.5;
      const noise = (Math.random() - 0.5) * 16;
      const factor = (weave1 * 0.15 + weave2 * 0.15 + 0.7) * 255 + noise;

      // Blend with base color
      data[idx] = Math.min(255, Math.max(0, (data[idx] * factor) / 255));
      data[idx + 1] = Math.min(255, Math.max(0, (data[idx + 1] * factor) / 255));
      data[idx + 2] = Math.min(255, Math.max(0, (data[idx + 2] * factor) / 255));
    }
  }

  ctx.putImageData(imgData, 0, 0);

  // Subtle folds / fabric creases
  ctx.strokeStyle = 'rgba(0,0,0,0.06)';
  ctx.lineWidth = 12;
  ctx.filter = 'blur(6px)';
  ctx.beginPath();
  ctx.moveTo(0, 120);
  ctx.bezierCurveTo(180, 160, 320, 90, size, 140);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(0, 360);
  ctx.bezierCurveTo(160, 320, 340, 410, size, 380);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 3);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Procedural Dynamic OLED Display Canvas Texture
 * Renders at high resolution (1024x1024) to maintain razor-sharp text and graphics in 3D.
 */
export class OledCanvasRenderer {
  public canvas: HTMLCanvasElement;
  public texture: THREE.CanvasTexture;
  private ctx: CanvasRenderingContext2D;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = 1024;
    this.canvas.height = 1024;
    this.ctx = this.canvas.getContext('2d')!;

    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.texture.minFilter = THREE.LinearFilter;
    this.texture.magFilter = THREE.LinearFilter;
  }

  public render(
    compartment: CompartmentId,
    weight: number,
    state: OledState,
    humidity: number
  ) {
    const { ctx, canvas } = this;
    const w = canvas.width;
    const h = canvas.height;

    // Deep OLED Black background with subtle inner bezel reflection
    ctx.fillStyle = '#060709';
    ctx.fillRect(0, 0, w, h);

    // Subtle edge gradient for glossy display integration
    const grad = ctx.createRadialGradient(w / 2, h / 2, 100, w / 2, h / 2, w * 0.7);
    grad.addColorStop(0, '#0a0d14');
    grad.addColorStop(1, '#020305');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Color definitions
    let primaryColor = '#9EEAF9'; // Crisp Ice-Cyan default (matching reference photo)
    let badgeBorderColor = '#56C5D0';
    let statusText = 'HALF LOAD AVAILABLE';
    let secondaryMessage = '';

    if (state === 'OVERLOAD') {
      primaryColor = '#FF4D4D';
      badgeBorderColor = '#FF4D4D';
      statusText = 'REMOVE CLOTHES';
      secondaryMessage = 'CAPACITY EXCEEDED';
    } else if (state === 'POSSIBLE_DAMP') {
      primaryColor = '#FFB84D';
      badgeBorderColor = '#FFB84D';
      statusText = 'CHECK CLOTHES';
      secondaryMessage = `HUMIDITY ${humidity}%`;
    } else if (state === 'WASH_NOW') {
      primaryColor = '#4ADE80';
      badgeBorderColor = '#4ADE80';
      statusText = 'LOAD READY';
    } else if (state === 'WAIT') {
      primaryColor = '#9EEAF9';
      badgeBorderColor = '#3A6B7C';
      statusText = weight === 0 ? 'ADD LAUNDRY' : 'CONTINUE ADDING';
    }

    ctx.save();

    // 1. TOP ICON: Folded Garment / Hanger (Clean geometric vector matching reference)
    ctx.strokeStyle = primaryColor;
    ctx.fillStyle = primaryColor;
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const iconY = 175;
    const iconSize = 80;

    // Outline of T-shirt icon
    ctx.beginPath();
    ctx.moveTo(w / 2 - iconSize, iconY - 30); // left shoulder
    ctx.lineTo(w / 2 - iconSize * 0.5, iconY - 50); // neck left
    ctx.quadraticCurveTo(w / 2, iconY - 35, w / 2 + iconSize * 0.5, iconY - 50); // collar
    ctx.lineTo(w / 2 + iconSize, iconY - 30); // right shoulder
    ctx.lineTo(w / 2 + iconSize * 1.3, iconY - 5); // right sleeve outer
    ctx.lineTo(w / 2 + iconSize * 0.9, iconY + 25); // right sleeve bottom
    ctx.lineTo(w / 2 + iconSize * 0.7, iconY + 15); // right armpit
    ctx.lineTo(w / 2 + iconSize * 0.65, iconY + 70); // bottom right hem
    ctx.lineTo(w / 2 - iconSize * 0.65, iconY + 70); // bottom left hem
    ctx.lineTo(w / 2 - iconSize * 0.7, iconY + 15); // left armpit
    ctx.lineTo(w / 2 - iconSize * 0.9, iconY + 25); // left sleeve bottom
    ctx.lineTo(w / 2 - iconSize * 1.3, iconY - 5); // left sleeve outer
    ctx.closePath();
    ctx.stroke();

    // 2. COMPARTMENT NAME (or Warning Header)
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = primaryColor;
    ctx.font = '600 42px "Plus Jakarta Sans", system-ui, -apple-system, sans-serif';
    ctx.letterSpacing = '6px';

    let headerLabel = compartment.toUpperCase();
    if (state === 'OVERLOAD') {
      headerLabel = 'OVERLOAD';
    } else if (state === 'POSSIBLE_DAMP') {
      headerLabel = 'POSSIBLE DAMP';
    } else if (state === 'WAIT' && weight === 0) {
      headerLabel = compartment.toUpperCase();
    }
    ctx.fillText(headerLabel, w / 2, 330);

    // 3. WEIGHT DISPLAY (Large bold numbers)
    ctx.font = '700 136px "Plus Jakarta Sans", "JetBrains Mono", sans-serif';
    ctx.letterSpacing = '1px';
    const weightStr = `${weight.toFixed(1)}`;
    const weightNumWidth = ctx.measureText(weightStr).width;

    ctx.font = '500 52px "Plus Jakarta Sans", sans-serif';
    const unitWidth = ctx.measureText(' kg').width;

    const totalWidth = weightNumWidth + unitWidth;
    const startX = (w - totalWidth) / 2;

    // Draw number
    ctx.font = '700 136px "Plus Jakarta Sans", "JetBrains Mono", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(weightStr, startX, 480);

    // Draw 'kg' unit
    ctx.font = '500 52px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(' kg', startX + weightNumWidth, 480);

    // 4. STATUS BADGE BOX (Matching the reference rounded pill outline)
    const badgeW = 620;
    const badgeH = 130;
    const badgeX = (w - badgeW) / 2;
    const badgeY = 600;
    const badgeR = 24;

    ctx.strokeStyle = badgeBorderColor;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, badgeW, badgeH, badgeR);
    ctx.stroke();

    // Fill badge with subtle glow
    ctx.fillStyle = state === 'OVERLOAD' ? 'rgba(255, 77, 77, 0.08)' : 'rgba(86, 197, 208, 0.08)';
    ctx.fill();

    // Text inside badge
    ctx.textAlign = 'center';
    ctx.fillStyle = primaryColor;
    ctx.font = '600 36px "Plus Jakarta Sans", sans-serif';
    ctx.letterSpacing = '3px';
    ctx.fillText(statusText, w / 2, badgeY + badgeH / 2);

    // 5. SECONDARY SUBTEXT (if any)
    if (secondaryMessage) {
      ctx.fillStyle = primaryColor;
      ctx.font = '500 28px "Plus Jakarta Sans", sans-serif';
      ctx.letterSpacing = '2px';
      ctx.fillText(secondaryMessage, w / 2, 765);
    }

    // 6. BOTTOM SELECTION DOTS (Three dots matching reference)
    const dotY = 860;
    const dotSpacing = 36;
    const compIndices: Record<CompartmentId, number> = {
      whites: 0,
      colours: 1,
      delicates: 2,
    };
    const activeDotIdx = compIndices[compartment];

    for (let i = 0; i < 3; i++) {
      const dotX = w / 2 + (i - 1) * dotSpacing;
      ctx.beginPath();
      ctx.arc(dotX, dotY, i === activeDotIdx ? 8 : 5, 0, Math.PI * 2);
      ctx.fillStyle = i === activeDotIdx ? primaryColor : 'rgba(255, 255, 255, 0.25)';
      ctx.fill();
    }

    ctx.restore();
    this.texture.needsUpdate = true;
  }
}
