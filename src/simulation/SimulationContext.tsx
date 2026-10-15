import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  CompartmentId,
  DisplayMode,
  OledState,
  Garment,
  CompartmentData,
  SimulationConfig,
  SimulationState,
  UxTask,
} from '../types/loadwise';
import { soundManager } from '../audio/soundManager';

export interface SimulationContextType {
  state: SimulationState;
  config: SimulationConfig;
  updateConfig: (newConfig: Partial<SimulationConfig>) => void;
  selectCompartment: (id: CompartmentId) => void;
  selectDisplayMode: (mode: DisplayMode) => void;
  rotateKnobTo: (angle: number) => void;
  cycleCompartmentKnob: (direction: 1 | -1) => void;
  pressKnob: () => void;
  addGarment: (item: { name: string; weight: number; type: Garment['type']; color?: string }) => void;
  removeGarment: () => void;
  clearCompartment: (id?: CompartmentId) => void;
  setSimulatedHumidity: (val: number) => void;
  dismissHumidityAlert: () => void;
  toggleLinerLift: (id?: CompartmentId) => void;
  applyPreset: (presetId: string) => void;
  resetAll: () => void;
  toggleAudioMute: () => void;
  setCameraView: (view: SimulationState['cameraView']) => void;
  currentOledState: OledState;
  activeCompartmentData: CompartmentData;
  totalWeight: number;
  totalGarmentsCount: number;
  // Guided Tour
  isTourActive: boolean;
  tourStep: number;
  startGuidedTour: () => void;
  pauseGuidedTour: () => void;
  resumeGuidedTour: () => void;
  nextTourStep: () => void;
  prevTourStep: () => void;
  exitGuidedTour: () => void;
  // UX Evaluation
  tasks: UxTask[];
  startTask: (id: number) => void;
  completeTask: (id: number) => void;
  resetTasks: () => void;
  exportTestReport: () => string;
}

const DEFAULT_CONFIG: SimulationConfig = {
  compartmentCapacity: 5.0, // kg
  halfLoadRatio: 0.50, // 2.5 kg
  washReadyRatio: 0.80, // 4.0 kg
  humidityWarningThreshold: 72, // %
};

const INITIAL_COMPARTMENTS: Record<CompartmentId, CompartmentData> = {
  whites: {
    id: 'whites',
    label: 'WHITES',
    fabricName: 'Warm Ivory Linen',
    baseHex: '#EDE8DF',
    accentHex: '#FFFFFF',
    garments: [],
    weight: 0.0,
    capacity: 5.0,
    isLinerLifted: false,
  },
  colours: {
    id: 'colours',
    label: 'COLOURS',
    fabricName: 'Slate Blue Cotton',
    baseHex: '#526E7F',
    accentHex: '#38BDF8',
    garments: [
      { id: 'c1', name: 'Denim Jeans', weight: 0.85, type: 'jeans', color: '#334E68', compartment: 'colours', addedAt: 1 },
      { id: 'c2', name: 'Cotton Hoodie', weight: 0.70, type: 'shirt', color: '#102A43', compartment: 'colours', addedAt: 2 },
      { id: 'c3', name: 'Casual T-Shirt', weight: 0.35, type: 'tshirt', color: '#007791', compartment: 'colours', addedAt: 3 },
      { id: 'c4', name: 'Workout Shirt', weight: 0.35, type: 'tshirt', color: '#264653', compartment: 'colours', addedAt: 4 },
      { id: 'c5', name: 'Bath Towel', weight: 0.35, type: 'towel', color: '#2B6CB0', compartment: 'colours', addedAt: 5 },
    ],
    weight: 2.6,
    capacity: 5.0,
    isLinerLifted: false,
  },
  delicates: {
    id: 'delicates',
    label: 'DELICATES',
    fabricName: 'Dusty Rose Twill',
    baseHex: '#C98A96',
    accentHex: '#F48FB1',
    garments: [],
    weight: 0.0,
    capacity: 5.0,
    isLinerLifted: false,
  },
};

const INITIAL_TASKS: UxTask[] = [
  {
    id: 1,
    title: 'Select Whites & Add Laundry',
    instruction: 'Switch selection to the Whites compartment and add at least one garment.',
    targetCriteria: 'Whites selected and weight > 0 kg',
    completed: false,
    active: false,
    timeSpentSeconds: 0,
  },
  {
    id: 2,
    title: 'Inspect Colours Load Weight',
    instruction: 'Switch to Colours and verify the live OLED weight reading matches 2.6 kg.',
    targetCriteria: 'Colours selected and active',
    completed: false,
    active: false,
    timeSpentSeconds: 0,
  },
  {
    id: 3,
    title: 'Trigger & Resolve Overload',
    instruction: 'Add garments until Colours exceeds 5.0 kg capacity, observe warning, then remove items to recover.',
    targetCriteria: 'Exceed 5.0 kg and then reduce below 5.0 kg',
    completed: false,
    active: false,
    timeSpentSeconds: 0,
  },
  {
    id: 4,
    title: 'Respond to Moisture Alert',
    instruction: 'Simulate high humidity above 72% to see POSSIBLE DAMP CLOTHES, then clear the alert.',
    targetCriteria: 'Trigger damp alert and dismiss or lower humidity',
    completed: false,
    active: false,
    timeSpentSeconds: 0,
  },
  {
    id: 5,
    title: 'Remove & Replace Fabric Liner',
    instruction: 'Lift one of the removable fabric liners out of the hamper and return it to its bay.',
    targetCriteria: 'Lift liner and replace liner',
    completed: false,
    active: false,
    timeSpentSeconds: 0,
  },
  {
    id: 6,
    title: 'Reset Hamper to Default',
    instruction: 'Use the Reset control to restore LoadWise to its baseline demonstration state.',
    targetCriteria: 'Execute system reset',
    completed: false,
    active: false,
    timeSpentSeconds: 0,
  },
];

const SimulationContext = createContext<SimulationContextType | null>(null);

export const SimulationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<SimulationConfig>(DEFAULT_CONFIG);
  const [state, setState] = useState<SimulationState>({
    selectedCompartment: 'colours',
    displayMode: 'colours',
    compartments: INITIAL_COMPARTMENTS,
    simulatedHumidity: 48,
    isHumidityAlertDismissed: false,
    knobAngle: 0, // 0 corresponds to Colours (center)
    isKnobPressed: false,
    audioMuted: false,
    activePresetId: 'reference',
    cameraView: 'hero',
  });

  // Guided Tour State
  const [isTourActive, setIsTourActive] = useState<boolean>(false);
  const [tourStep, setTourStep] = useState<number>(0);
  const [isTourPaused, setIsTourPaused] = useState<boolean>(false);

  // UX Tasks
  const [tasks, setTasks] = useState<UxTask[]>(INITIAL_TASKS);

  // Active compartment data
  const activeCompartmentData = state.compartments[state.selectedCompartment];

  // Total weight and count
  const totalWeight = useMemo(() => {
    return Number(
      (
        state.compartments.whites.weight +
        state.compartments.colours.weight +
        state.compartments.delicates.weight
      ).toFixed(2)
    );
  }, [state.compartments]);

  const totalGarmentsCount = useMemo(() => {
    return (
      state.compartments.whites.garments.length +
      state.compartments.colours.garments.length +
      state.compartments.delicates.garments.length
    );
  }, [state.compartments]);

  // Derive OLED state according to requirements:
  // Warning Priority:
  // 1. OVERLOAD takes precedence over all.
  // 2. Elevated simulated humidity -> POSSIBLE DAMP CLOTHES (unless overloaded).
  // 3. WASH NOW (>= 80% capacity)
  // 4. HALF LOAD (>= 50% capacity)
  // 5. WAIT (< 50% capacity or empty)
  const currentOledState = useMemo<OledState>(() => {
    const comp = state.compartments[state.selectedCompartment];
    const isOverloaded = comp.weight > config.compartmentCapacity;
    const isDampWarning =
      state.simulatedHumidity >= config.humidityWarningThreshold &&
      !state.isHumidityAlertDismissed;

    if (isOverloaded) {
      return 'OVERLOAD';
    }
    if (isDampWarning) {
      return 'POSSIBLE_DAMP';
    }
    if (comp.weight >= config.compartmentCapacity * config.washReadyRatio) {
      return 'WASH_NOW';
    }
    if (comp.weight >= config.compartmentCapacity * config.halfLoadRatio) {
      return 'HALF_LOAD';
    }
    return 'WAIT';
  }, [state.selectedCompartment, state.compartments, state.simulatedHumidity, state.isHumidityAlertDismissed, config]);

  const updateConfig = useCallback((newConfig: Partial<SimulationConfig>) => {
    setConfig((prev) => ({ ...prev, ...newConfig }));
  }, []);

  const selectCompartment = useCallback((id: CompartmentId) => {
    soundManager.playKnobTick();
    const angles: Record<CompartmentId, number> = {
      whites: -0.85,
      colours: 0,
      delicates: 0.85,
    };
    setState((prev) => ({
      ...prev,
      selectedCompartment: id,
      displayMode: id,
      knobAngle: angles[id],
    }));
  }, []);

  const selectDisplayMode = useCallback((mode: DisplayMode) => {
    setState((prev) => ({ ...prev, displayMode: mode }));
  }, []);

  const rotateKnobTo = useCallback((angle: number) => {
    soundManager.playKnobTick();
    // Map angle to compartment
    let comp: CompartmentId = 'colours';
    if (angle < -0.4) comp = 'whites';
    else if (angle > 0.4) comp = 'delicates';

    setState((prev) => ({
      ...prev,
      knobAngle: angle,
      selectedCompartment: comp,
      displayMode: comp,
    }));
  }, []);

  const cycleCompartmentKnob = useCallback((direction: 1 | -1) => {
    const order: CompartmentId[] = ['whites', 'colours', 'delicates'];
    const curIdx = order.indexOf(state.selectedCompartment);
    const nextIdx = Math.max(0, Math.min(order.length - 1, curIdx + direction));
    selectCompartment(order[nextIdx]);
  }, [state.selectedCompartment, selectCompartment]);

  const pressKnob = useCallback(() => {
    soundManager.playKnobPress();
    setState((prev) => ({ ...prev, isKnobPressed: true }));
    setTimeout(() => {
      setState((prev) => ({ ...prev, isKnobPressed: false }));
    }, 150);
  }, []);

  const addGarment = useCallback(
    (item: { name: string; weight: number; type: Garment['type']; color?: string }) => {
      soundManager.playGarmentAdd();
      const compId = state.selectedCompartment;
      const prevComp = state.compartments[compId];
      const newWeight = Number((prevComp.weight + item.weight).toFixed(2));
      const newGarment: Garment = {
        id: `g_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: item.name,
        weight: item.weight,
        type: item.type,
        color:
          item.color ||
          (compId === 'whites'
            ? '#F7F7F2'
            : compId === 'colours'
            ? '#2A6F97'
            : '#E5989B'),
        compartment: compId,
        addedAt: Date.now(),
      };

      // Check audio triggers
      const cap = config.compartmentCapacity;
      if (newWeight > cap && prevComp.weight <= cap) {
        setTimeout(() => soundManager.playOverloadWarning(), 300);
      } else if (
        newWeight >= cap * config.washReadyRatio &&
        prevComp.weight < cap * config.washReadyRatio
      ) {
        setTimeout(() => soundManager.playWashReadyChime(), 300);
      } else if (
        newWeight >= cap * config.halfLoadRatio &&
        prevComp.weight < cap * config.halfLoadRatio
      ) {
        setTimeout(() => soundManager.playHalfLoadChime(), 300);
      }

      setState((prev) => ({
        ...prev,
        compartments: {
          ...prev.compartments,
          [compId]: {
            ...prevComp,
            weight: newWeight,
            garments: [...prevComp.garments, newGarment],
          },
        },
      }));
    },
    [state.selectedCompartment, state.compartments, config]
  );

  const removeGarment = useCallback(() => {
    const compId = state.selectedCompartment;
    const prevComp = state.compartments[compId];
    if (prevComp.garments.length === 0 && prevComp.weight <= 0) {
      return;
    }
    soundManager.playGarmentRemove();
    const lastGarment = prevComp.garments[prevComp.garments.length - 1];
    const weightToSubtract = lastGarment ? lastGarment.weight : 0.5;
    const newWeight = Math.max(0, Number((prevComp.weight - weightToSubtract).toFixed(2)));
    const updatedGarments = prevComp.garments.slice(0, -1);

    setState((prev) => ({
      ...prev,
      compartments: {
        ...prev.compartments,
        [compId]: {
          ...prevComp,
          weight: newWeight,
          garments: updatedGarments,
        },
      },
    }));
  }, [state.selectedCompartment, state.compartments]);

  const clearCompartment = useCallback((id?: CompartmentId) => {
    const target = id || state.selectedCompartment;
    soundManager.playGarmentRemove();
    setState((prev) => ({
      ...prev,
      compartments: {
        ...prev.compartments,
        [target]: {
          ...prev.compartments[target],
          weight: 0.0,
          garments: [],
        },
      },
    }));
  }, [state.selectedCompartment]);

  const setSimulatedHumidity = useCallback((val: number) => {
    setState((prev) => {
      const isCrossing = val >= config.humidityWarningThreshold && prev.simulatedHumidity < config.humidityWarningThreshold;
      if (isCrossing && !prev.isHumidityAlertDismissed) {
        soundManager.playDampCaution();
      }
      return {
        ...prev,
        simulatedHumidity: val,
        isHumidityAlertDismissed: val < config.humidityWarningThreshold ? false : prev.isHumidityAlertDismissed,
      };
    });
  }, [config.humidityWarningThreshold]);

  const dismissHumidityAlert = useCallback(() => {
    soundManager.playKnobPress();
    setState((prev) => ({
      ...prev,
      isHumidityAlertDismissed: true,
      simulatedHumidity: 48, // reset to comfortable normal
    }));
  }, []);

  const toggleLinerLift = useCallback((id?: CompartmentId) => {
    const target = id || state.selectedCompartment;
    soundManager.playLinerLift();
    setState((prev) => ({
      ...prev,
      compartments: {
        ...prev.compartments,
        [target]: {
          ...prev.compartments[target],
          isLinerLifted: !prev.compartments[target].isLinerLifted,
        },
      },
    }));
  }, [state.selectedCompartment]);

  const setCameraView = useCallback((view: SimulationState['cameraView']) => {
    setState((prev) => ({ ...prev, cameraView: view }));
  }, []);

  const toggleAudioMute = useCallback(() => {
    const nextMuted = !state.audioMuted;
    soundManager.setMuted(nextMuted);
    if (!nextMuted) {
      soundManager.unlock();
      soundManager.playKnobTick();
    }
    setState((prev) => ({ ...prev, audioMuted: nextMuted }));
  }, [state.audioMuted]);

  const applyPreset = useCallback((presetId: string) => {
    soundManager.playKnobPress();
    switch (presetId) {
      case 'empty':
        setState((prev) => ({
          ...prev,
          activePresetId: 'empty',
          selectedCompartment: 'whites',
          displayMode: 'whites',
          knobAngle: -0.85,
          simulatedHumidity: 45,
          isHumidityAlertDismissed: false,
          compartments: {
            whites: { ...prev.compartments.whites, weight: 0.0, garments: [], isLinerLifted: false },
            colours: { ...prev.compartments.colours, weight: 0.0, garments: [], isLinerLifted: false },
            delicates: { ...prev.compartments.delicates, weight: 0.0, garments: [], isLinerLifted: false },
          },
        }));
        break;

      case 'reference': // Replicating reference image exact state!
        setState((prev) => ({
          ...prev,
          activePresetId: 'reference',
          selectedCompartment: 'colours',
          displayMode: 'colours',
          knobAngle: 0,
          simulatedHumidity: 48,
          isHumidityAlertDismissed: false,
          cameraView: 'hero',
          compartments: {
            ...prev.compartments,
            colours: {
              ...prev.compartments.colours,
              weight: 2.6,
              garments: [
                { id: 'c1', name: 'Denim Jeans', weight: 0.85, type: 'jeans', color: '#334E68', compartment: 'colours', addedAt: 1 },
                { id: 'c2', name: 'Cotton Hoodie', weight: 0.70, type: 'shirt', color: '#102A43', compartment: 'colours', addedAt: 2 },
                { id: 'c3', name: 'Casual T-Shirt', weight: 0.35, type: 'tshirt', color: '#007791', compartment: 'colours', addedAt: 3 },
                { id: 'c4', name: 'Workout Shirt', weight: 0.35, type: 'tshirt', color: '#264653', compartment: 'colours', addedAt: 4 },
                { id: 'c5', name: 'Bath Towel', weight: 0.35, type: 'towel', color: '#2B6CB0', compartment: 'colours', addedAt: 5 },
              ],
              isLinerLifted: false,
            },
          },
        }));
        break;

      case 'wash_ready':
        setState((prev) => ({
          ...prev,
          activePresetId: 'wash_ready',
          selectedCompartment: 'colours',
          displayMode: 'colours',
          knobAngle: 0,
          simulatedHumidity: 50,
          isHumidityAlertDismissed: false,
          compartments: {
            ...prev.compartments,
            colours: {
              ...prev.compartments.colours,
              weight: 4.2,
              garments: [
                { id: 'wr1', name: 'Denim Jeans', weight: 0.85, type: 'jeans', color: '#334E68', compartment: 'colours', addedAt: 1 },
                { id: 'wr2', name: 'Cotton Hoodie', weight: 0.85, type: 'shirt', color: '#102A43', compartment: 'colours', addedAt: 2 },
                { id: 'wr3', name: 'Casual T-Shirt', weight: 0.5, type: 'tshirt', color: '#007791', compartment: 'colours', addedAt: 3 },
                { id: 'wr4', name: 'Bath Towels (2x)', weight: 1.2, type: 'towel', color: '#2B6CB0', compartment: 'colours', addedAt: 4 },
                { id: 'wr5', name: 'Chino Pants', weight: 0.8, type: 'jeans', color: '#486581', compartment: 'colours', addedAt: 5 },
              ],
              isLinerLifted: false,
            },
          },
        }));
        soundManager.playWashReadyChime();
        break;

      case 'overload':
        setState((prev) => ({
          ...prev,
          activePresetId: 'overload',
          selectedCompartment: 'colours',
          displayMode: 'colours',
          knobAngle: 0,
          compartments: {
            ...prev.compartments,
            colours: {
              ...prev.compartments.colours,
              weight: 5.4,
              garments: [
                { id: 'o1', name: 'Denim Jeans (2x)', weight: 1.8, type: 'jeans', color: '#334E68', compartment: 'colours', addedAt: 1 },
                { id: 'o2', name: 'Heavy Blankets', weight: 2.2, type: 'towel', color: '#102A43', compartment: 'colours', addedAt: 2 },
                { id: 'o3', name: 'Cotton Sweaters', weight: 1.4, type: 'shirt', color: '#2B6CB0', compartment: 'colours', addedAt: 3 },
              ],
              isLinerLifted: false,
            },
          },
        }));
        soundManager.playOverloadWarning();
        break;

      case 'damp_warning':
        setState((prev) => ({
          ...prev,
          activePresetId: 'damp_warning',
          selectedCompartment: 'colours',
          simulatedHumidity: 84,
          isHumidityAlertDismissed: false,
        }));
        soundManager.playDampCaution();
        break;
    }
  }, []);

  const resetAll = useCallback(() => {
    soundManager.playReset();
    applyPreset('reference');
  }, [applyPreset]);

  // Guided Tour Control
  const startGuidedTour = useCallback(() => {
    soundManager.unlock();
    setIsTourActive(true);
    setTourStep(0);
    setIsTourPaused(false);
  }, []);

  const pauseGuidedTour = useCallback(() => {
    setIsTourPaused(true);
  }, []);

  const resumeGuidedTour = useCallback(() => {
    setIsTourPaused(false);
  }, []);

  const nextTourStep = useCallback(() => {
    setTourStep((prev) => Math.min(prev + 1, 11));
  }, []);

  const prevTourStep = useCallback(() => {
    setTourStep((prev) => Math.max(prev - 1, 0));
  }, []);

  const exitGuidedTour = useCallback(() => {
    setIsTourActive(false);
    setTourStep(0);
    setState((prev) => ({ ...prev, cameraView: 'hero' }));
  }, []);

  // UX Tasks actions
  const startTask = useCallback((id: number) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, active: true } : { ...t, active: false }))
    );
  }, []);

  const completeTask = useCallback((id: number) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: true, active: false } : t))
    );
  }, []);

  const resetTasks = useCallback(() => {
    setTasks(INITIAL_TASKS);
  }, []);

  // Monitor UX task criteria automatically
  useEffect(() => {
    // Task 1: Select whites & add laundry
    if (state.selectedCompartment === 'whites' && state.compartments.whites.weight > 0) {
      completeTask(1);
    }
    // Task 2: Colours weight 2.6 kg inspected
    if (state.selectedCompartment === 'colours' && state.compartments.colours.weight === 2.6) {
      completeTask(2);
    }
    // Task 3: Overload recovery (check if colors was overloaded then returned)
    if (state.compartments.colours.weight <= 5.0 && state.compartments.colours.weight > 3.0 && state.activePresetId === 'overload') {
      completeTask(3);
    }
    // Task 4: Damp clothes cleared
    if (state.isHumidityAlertDismissed && state.simulatedHumidity < 72) {
      completeTask(4);
    }
    // Task 5: Liner lifted and returned
    if (Object.values(state.compartments).some((c) => c.isLinerLifted)) {
      completeTask(5);
    }
  }, [state, completeTask]);

  // UX task timer tick
  useEffect(() => {
    const activeTask = tasks.find((t) => t.active && !t.completed);
    if (!activeTask) return;
    const interval = setInterval(() => {
      setTasks((prev) =>
        prev.map((t) => (t.id === activeTask.id ? { ...t, timeSpentSeconds: t.timeSpentSeconds + 1 } : t))
      );
    }, 1000);
    return () => clearInterval(interval);
  }, [tasks]);

  const exportTestReport = useCallback(() => {
    const timestamp = new Date().toISOString();
    const completedCount = tasks.filter((t) => t.completed).length;
    let report = `=======================================================\n`;
    report += `LOADWISE SMART LAUNDRY BASKET — UX EVALUATION REPORT\n`;
    report += `Timestamp: ${timestamp}\n`;
    report += `Status: ${completedCount} / ${tasks.length} Tasks Completed\n`;
    report += `Total Hamper Load: ${totalWeight} kg (${totalGarmentsCount} garments)\n`;
    report += `=======================================================\n\n`;

    tasks.forEach((t) => {
      report += `TASK ${t.id}: ${t.title}\n`;
      report += `Instruction: ${t.instruction}\n`;
      report += `Success: ${t.completed ? 'PASSED' : 'PENDING'}\n`;
      report += `Duration: ${t.timeSpentSeconds} seconds\n`;
      report += `Criteria: ${t.targetCriteria}\n`;
      report += `-------------------------------------------------------\n`;
    });

    return report;
  }, [tasks, totalWeight, totalGarmentsCount]);

  // Automated Guided Tour Step actions
  useEffect(() => {
    if (!isTourActive || isTourPaused) return;

    switch (tourStep) {
      case 0: // Hero intro
        setState((prev) => ({ ...prev, cameraView: 'hero' }));
        break;
      case 1: // 360 Spin
        setState((prev) => ({ ...prev, cameraView: 'rear' }));
        break;
      case 2: // Top View
        setState((prev) => ({ ...prev, cameraView: 'top' }));
        break;
      case 3: // OLED & Knob Close-up
        setState((prev) => ({ ...prev, cameraView: 'oled' }));
        break;
      case 4: // WAIT state demonstration
        applyPreset('empty');
        setState((prev) => ({ ...prev, cameraView: 'oled' }));
        break;
      case 5: // Select Colours
        selectCompartment('colours');
        setState((prev) => ({ ...prev, cameraView: 'front' }));
        break;
      case 6: // 2.6 kg Half Load Reference
        applyPreset('reference');
        setState((prev) => ({ ...prev, cameraView: 'oled' }));
        break;
      case 7: // Wash Ready
        applyPreset('wash_ready');
        setState((prev) => ({ ...prev, cameraView: 'oled' }));
        break;
      case 8: // Overload Warning
        applyPreset('overload');
        setState((prev) => ({ ...prev, cameraView: 'oled' }));
        break;
      case 9: // Damp Caution
        applyPreset('damp_warning');
        setState((prev) => ({ ...prev, cameraView: 'oled' }));
        break;
      case 10: // Liner Lift
        toggleLinerLift('colours');
        setState((prev) => ({ ...prev, cameraView: 'compartment' }));
        break;
      case 11: // Finale Hero
        setState((prev) => ({ ...prev, cameraView: 'hero' }));
        break;
    }
  }, [tourStep, isTourActive, isTourPaused, applyPreset, selectCompartment, toggleLinerLift]);

  return (
    <SimulationContext.Provider
      value={{
        state,
        config,
        updateConfig,
        selectCompartment,
        selectDisplayMode,
        rotateKnobTo,
        cycleCompartmentKnob,
        pressKnob,
        addGarment,
        removeGarment,
        clearCompartment,
        setSimulatedHumidity,
        dismissHumidityAlert,
        toggleLinerLift,
        applyPreset,
        resetAll,
        toggleAudioMute,
        setCameraView,
        currentOledState,
        activeCompartmentData,
        totalWeight,
        totalGarmentsCount,
        isTourActive,
        tourStep,
        startGuidedTour,
        pauseGuidedTour,
        resumeGuidedTour,
        nextTourStep,
        prevTourStep,
        exitGuidedTour,
        tasks,
        startTask,
        completeTask,
        resetTasks,
        exportTestReport,
      }}
    >
      {children}
    </SimulationContext.Provider>
  );
};

export const useSimulation = (): SimulationContextType => {
  const context = useContext(SimulationContext);
  if (!context) {
    throw new Error('useSimulation must be used within a SimulationProvider');
  }
  return context;
};
