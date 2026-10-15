import React, { useEffect, useRef } from 'react';
import { Camera, Eye, AlertTriangle, Droplets, CameraOff, Sparkles } from 'lucide-react';
import { useSimulation } from '../simulation/SimulationContext';
import { LoadWiseSceneManager } from '../3d/LoadWiseSceneManager';
import { CompartmentId } from '../types/loadwise';

export const Viewer3D: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneManagerRef = useRef<LoadWiseSceneManager | null>(null);

  const {
    state,
    currentOledState,
    activeCompartmentData,
    selectCompartment,
    pressKnob,
    cycleCompartmentKnob,
    setCameraView,
    dismissHumidityAlert,
    removeGarment,
  } = useSimulation();

  // Initialize Scene Once
  useEffect(() => {
    if (!containerRef.current) return;

    const manager = new LoadWiseSceneManager(containerRef.current, {
      onSelectCompartment: (cid: CompartmentId) => {
        selectCompartment(cid);
      },
      onKnobClick: () => {
        pressKnob();
        cycleCompartmentKnob(1);
      },
    });

    sceneManagerRef.current = manager;

    return () => {
      manager.dispose();
      sceneManagerRef.current = null;
    };
  }, [selectCompartment, pressKnob, cycleCompartmentKnob]);

  // Sync Camera View Presets
  useEffect(() => {
    if (sceneManagerRef.current) {
      sceneManagerRef.current.setViewPreset(state.cameraView);
    }
  }, [state.cameraView]);

  // Sync Data to 3D Model
  useEffect(() => {
    if (!sceneManagerRef.current) return;

    const garmentMap = {
      whites: state.compartments.whites.garments,
      colours: state.compartments.colours.garments,
      delicates: state.compartments.delicates.garments,
    };

    const linerMap = {
      whites: state.compartments.whites.isLinerLifted,
      colours: state.compartments.colours.isLinerLifted,
      delicates: state.compartments.delicates.isLinerLifted,
    };

    sceneManagerRef.current.updateModelData(
      state.selectedCompartment,
      activeCompartmentData.weight,
      currentOledState,
      state.simulatedHumidity,
      state.knobAngle,
      state.isKnobPressed,
      garmentMap,
      linerMap
    );
  }, [
    state.selectedCompartment,
    state.compartments,
    state.knobAngle,
    state.isKnobPressed,
    state.simulatedHumidity,
    activeCompartmentData.weight,
    currentOledState,
  ]);

  const handleTakeScreenshot = () => {
    if (!sceneManagerRef.current) return;
    const dataUrl = sceneManagerRef.current.takeScreenshot();
    const link = document.createElement('a');
    link.download = `LoadWise_${state.selectedCompartment}_${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  };

  const cameraButtons: { id: typeof state.cameraView; label: string }[] = [
    { id: 'hero', label: 'Hero 3/4' },
    { id: 'front', label: 'Front' },
    { id: 'top', label: 'Top View' },
    { id: 'rear', label: 'Rear' },
    { id: 'oled', label: 'OLED Close-up' },
    { id: 'compartment', label: 'Liners' },
  ];

  return (
    <div className="relative w-full h-full flex flex-col bg-[#F3F2EF] overflow-hidden select-none">
      {/* 3D WebGL Canvas Container */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Floating System Status Alert (Top Center) */}
      {currentOledState === 'OVERLOAD' && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 px-4 py-2 bg-red-600 text-white rounded-xl shadow-lg border border-red-500 text-xs font-semibold animate-in fade-in slide-in-from-top-2 duration-200">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>OVERLOAD DETECTED ({activeCompartmentData.weight.toFixed(1)} kg &gt; 5.0 kg capacity)</span>
          <button
            onClick={removeGarment}
            className="px-2.5 py-1 bg-white text-red-700 font-bold rounded hover:bg-neutral-100 transition-colors cursor-pointer"
          >
            Remove Garment
          </button>
        </div>
      )}

      {currentOledState === 'POSSIBLE_DAMP' && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 px-4 py-2 bg-amber-500 text-neutral-950 rounded-xl shadow-lg border border-amber-400 text-xs font-semibold animate-in fade-in slide-in-from-top-2 duration-200">
          <Droplets className="w-4 h-4 shrink-0 text-neutral-950" />
          <span>POSSIBLE DAMP CLOTHES ({state.simulatedHumidity}% RH detected in basket)</span>
          <button
            onClick={dismissHumidityAlert}
            className="px-2.5 py-1 bg-neutral-900 text-white font-medium rounded hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            Clear Warning
          </button>
        </div>
      )}

      {/* Floating Camera View Switcher (Top Left) */}
      <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-1.5 p-1 bg-white/80 backdrop-blur-md rounded-xl border border-neutral-200/80 shadow-sm">
        {cameraButtons.map((btn) => (
          <button
            key={btn.id}
            onClick={() => setCameraView(btn.id)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              state.cameraView === btn.id
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
            }`}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Floating Action Controls (Top Right) */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <button
          onClick={handleTakeScreenshot}
          title="Save 3D High-Res Screenshot"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/80 hover:bg-white text-neutral-700 hover:text-neutral-950 border border-neutral-200/80 rounded-xl text-xs font-medium shadow-sm transition-all cursor-pointer"
        >
          <Camera className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Snapshot</span>
        </button>
      </div>

      {/* 3D Interaction Hint (Bottom Center) */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 pointer-events-none text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-neutral-900/60 backdrop-blur-xs text-white/90 text-[11px] rounded-full tracking-wide">
          <span>Drag to orbit 360°</span>
          <span>·</span>
          <span>Scroll to zoom</span>
          <span>·</span>
          <span>Click hamper bays or knob to interact</span>
        </div>
      </div>
    </div>
  );
};
