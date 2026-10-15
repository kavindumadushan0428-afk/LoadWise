export type CompartmentId = 'whites' | 'colours' | 'delicates';

export type DisplayMode = 'overview' | CompartmentId;

export type OledState = 'WAIT' | 'HALF_LOAD' | 'WASH_NOW' | 'OVERLOAD' | 'POSSIBLE_DAMP';

export interface Garment {
  id: string;
  name: string;
  weight: number; // in kg
  type: 'tshirt' | 'towel' | 'shirt' | 'delicate' | 'jeans';
  color: string;
  compartment: CompartmentId;
  addedAt: number;
}

export interface CompartmentData {
  id: CompartmentId;
  label: string;
  fabricName: string;
  baseHex: string;
  accentHex: string;
  garments: Garment[];
  weight: number; // in kg
  capacity: number; // default 5.0 kg
  isLinerLifted: boolean;
}

export interface SimulationConfig {
  compartmentCapacity: number; // kg (default 5.0)
  halfLoadRatio: number; // 0.50 (2.5 kg)
  washReadyRatio: number; // 0.80 (4.0 kg)
  humidityWarningThreshold: number; // % (default 70%)
}

export interface SimulationState {
  selectedCompartment: CompartmentId;
  displayMode: DisplayMode;
  compartments: Record<CompartmentId, CompartmentData>;
  simulatedHumidity: number; // 20% to 95%
  isHumidityAlertDismissed: boolean;
  knobAngle: number; // in radians
  isKnobPressed: boolean;
  audioMuted: boolean;
  activePresetId: string | null;
  cameraView: 'hero' | 'front' | 'rear' | 'top' | 'oled' | 'compartment';
}

export interface UxTask {
  id: number;
  title: string;
  instruction: string;
  targetCriteria: string;
  completed: boolean;
  active: boolean;
  timeSpentSeconds: number;
}
