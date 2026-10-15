import React, { useState } from 'react';
import {
  Layers,
  Sliders,
  Plus,
  Minus,
  Trash2,
  RotateCw,
  RotateCcw,
  CircleDot,
  CheckCircle2,
  Droplets,
  AlertTriangle,
  Shirt,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useSimulation } from '../simulation/SimulationContext';
import { CompartmentId, Garment } from '../types/loadwise';

export const ControlDock: React.FC = () => {
  const {
    state,
    config,
    updateConfig,
    activeCompartmentData,
    currentOledState,
    totalWeight,
    totalGarmentsCount,
    selectCompartment,
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
  } = useSimulation();

  const [activeTab, setActiveTab] = useState<'laundry' | 'presets' | 'liners' | 'sensors'>('laundry');
  const [selectedGarmentType, setSelectedGarmentType] = useState<{
    name: string;
    weight: number;
    type: Garment['type'];
    color?: string;
  }>({
    name: 'Cotton T-Shirt',
    weight: 0.35,
    type: 'tshirt',
  });

  const [customWeight, setCustomWeight] = useState<number>(0.5);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  const garmentPresets: {
    name: string;
    weight: number;
    type: Garment['type'];
    color?: string;
  }[] = [
    { name: 'Casual T-Shirt', weight: 0.35, type: 'tshirt', color: '#38BDF8' },
    { name: 'Bath Towel', weight: 0.75, type: 'towel', color: '#1E40AF' },
    { name: 'Denim Jeans', weight: 0.85, type: 'jeans', color: '#1E293B' },
    { name: 'Delicate Silk', weight: 0.15, type: 'delicate', color: '#F472B6' },
    { name: 'Cotton Hoodie', weight: 0.70, type: 'shirt', color: '#475569' },
  ];

  const compartments: { id: CompartmentId; label: string; color: string; desc: string }[] = [
    { id: 'whites', label: 'WHITES', color: 'bg-neutral-200 border-neutral-300', desc: 'Ivory Linen' },
    { id: 'colours', label: 'COLOURS', color: 'bg-sky-400 border-sky-500', desc: 'Slate Blue' },
    { id: 'delicates', label: 'DELICATES', color: 'bg-pink-400 border-pink-500', desc: 'Dusty Rose' },
  ];

  const loadPercent = Math.min(100, Math.round((activeCompartmentData.weight / config.compartmentCapacity) * 100));

  return (
    <div className="w-full lg:w-96 xl:w-[420px] bg-neutral-900 border-l border-neutral-800 flex flex-col h-full text-white select-none overflow-hidden shrink-0">
      {/* Dock Header & Active OLED Status Mirror */}
      <div className="p-4 border-b border-neutral-800 bg-neutral-950/40">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold tracking-widest text-sky-400 uppercase">
              {activeCompartmentData.label}
            </span>
            <span className="text-neutral-500 text-xs">·</span>
            <span className="text-xs text-neutral-400">{activeCompartmentData.fabricName}</span>
          </div>

          {/* Quick Collapse Button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-neutral-400 hover:text-white p-1 rounded-md transition-colors"
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>

        {/* OLED Mirror Status Bar */}
        <div className="grid grid-cols-2 gap-3 p-3 bg-neutral-900/90 rounded-xl border border-neutral-800">
          <div>
            <div className="text-[10px] tracking-wider text-neutral-500 uppercase font-medium">Bay Weight</div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl font-bold font-mono tracking-tight text-white tabular-nums">
                {activeCompartmentData.weight.toFixed(1)}
              </span>
              <span className="text-xs text-neutral-400">/ {config.compartmentCapacity.toFixed(1)} kg</span>
            </div>
            {/* Mini Progress Bar */}
            <div className="w-full h-1.5 bg-neutral-800 rounded-full mt-2 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  currentOledState === 'OVERLOAD'
                    ? 'bg-red-500'
                    : currentOledState === 'WASH_NOW'
                    ? 'bg-emerald-400'
                    : currentOledState === 'HALF_LOAD'
                    ? 'bg-sky-400'
                    : 'bg-neutral-600'
                }`}
                style={{ width: `${loadPercent}%` }}
              />
            </div>
          </div>

          <div>
            <div className="text-[10px] tracking-wider text-neutral-500 uppercase font-medium">OLED Readout</div>
            <div className="mt-1">
              <span
                className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-md tracking-wide ${
                  currentOledState === 'OVERLOAD'
                    ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                    : currentOledState === 'POSSIBLE_DAMP'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : currentOledState === 'WASH_NOW'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : currentOledState === 'HALF_LOAD'
                    ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40'
                    : 'bg-neutral-800 text-neutral-300'
                }`}
              >
                {currentOledState.replace('_', ' ')}
              </span>
            </div>
            <div className="text-[11px] text-neutral-400 mt-1">
              {activeCompartmentData.garments.length} garments in liner
            </div>
          </div>
        </div>
      </div>

      {/* Compartment Selector Tabs */}
      <div className="grid grid-cols-3 gap-1.5 p-3 bg-neutral-950/20 border-b border-neutral-800">
        {compartments.map((comp) => {
          const isSelected = state.selectedCompartment === comp.id;
          const cData = state.compartments[comp.id];
          return (
            <button
              key={comp.id}
              onClick={() => selectCompartment(comp.id)}
              className={`flex flex-col items-center py-2 px-1 rounded-xl border text-center transition-all cursor-pointer ${
                isSelected
                  ? 'bg-neutral-800 border-sky-500/60 shadow-sm'
                  : 'bg-neutral-900/60 border-neutral-800/80 hover:bg-neutral-800/40'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${comp.color}`} />
                <span className="text-xs font-bold tracking-wide">{comp.label}</span>
              </div>
              <span className="text-[11px] font-mono tabular-nums text-neutral-400 mt-0.5">
                {cData.weight.toFixed(1)} kg
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Tab Controls Navigation */}
      <div className="flex items-center border-b border-neutral-800 bg-neutral-950/60 px-3">
        <button
          onClick={() => setActiveTab('laundry')}
          className={`flex-1 py-2.5 text-xs font-medium text-center border-b-2 transition-colors cursor-pointer ${
            activeTab === 'laundry'
              ? 'border-sky-400 text-white font-semibold'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          Laundry Ops
        </button>
        <button
          onClick={() => setActiveTab('presets')}
          className={`flex-1 py-2.5 text-xs font-medium text-center border-b-2 transition-colors cursor-pointer ${
            activeTab === 'presets'
              ? 'border-sky-400 text-white font-semibold'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          Presets
        </button>
        <button
          onClick={() => setActiveTab('liners')}
          className={`flex-1 py-2.5 text-xs font-medium text-center border-b-2 transition-colors cursor-pointer ${
            activeTab === 'liners'
              ? 'border-sky-400 text-white font-semibold'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          Liners
        </button>
        <button
          onClick={() => setActiveTab('sensors')}
          className={`flex-1 py-2.5 text-xs font-medium text-center border-b-2 transition-colors cursor-pointer ${
            activeTab === 'sensors'
              ? 'border-sky-400 text-white font-semibold'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          Moisture
        </button>
      </div>

      {/* Scrollable Content Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* TAB 1: LAUNDRY OPS */}
        {activeTab === 'laundry' && (
          <div className="space-y-4">
            {/* Rotary Knob Tactile Console */}
            <div className="p-3 bg-neutral-950/40 rounded-xl border border-neutral-800 space-y-2">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 flex items-center justify-between">
                <span>Rotary Knob Control</span>
                <span className="text-[10px] text-neutral-500 font-mono">3-Position Dial</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => cycleCompartmentKnob(-1)}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 bg-neutral-800 hover:bg-neutral-700 active:scale-95 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-sky-400" />
                  <span>Turn Left</span>
                </button>

                <button
                  onClick={pressKnob}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 bg-neutral-800 hover:bg-neutral-700 active:scale-95 rounded-lg text-xs font-semibold text-sky-300 transition-colors border border-sky-500/30 cursor-pointer"
                >
                  <CircleDot className="w-3.5 h-3.5" />
                  <span>Press Knob</span>
                </button>

                <button
                  onClick={() => cycleCompartmentKnob(1)}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 bg-neutral-800 hover:bg-neutral-700 active:scale-95 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                >
                  <RotateCw className="w-3.5 h-3.5 text-sky-400" />
                  <span>Turn Right</span>
                </button>
              </div>
            </div>

            {/* Garment Selector Tray */}
            <div className="space-y-2">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                Select Garment to Insert
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {garmentPresets.map((g) => {
                  const isSelected = selectedGarmentType.name === g.name;
                  return (
                    <button
                      key={g.name}
                      onClick={() => setSelectedGarmentType(g)}
                      className={`flex flex-col items-start p-2 rounded-lg border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-sky-500/10 border-sky-400 text-white'
                          : 'bg-neutral-900 border-neutral-800 hover:bg-neutral-800 text-neutral-300'
                      }`}
                    >
                      <span className="text-xs font-medium">{g.name}</span>
                      <span className="text-[11px] text-neutral-400 font-mono mt-0.5">+{g.weight} kg</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Primary Action Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => addGarment(selectedGarmentType)}
                className="flex items-center justify-center gap-2 py-2.5 px-4 bg-sky-500 hover:bg-sky-400 active:scale-95 text-neutral-950 font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add {selectedGarmentType.name.split(' ')[0]}</span>
              </button>

              <button
                onClick={removeGarment}
                disabled={activeCompartmentData.weight <= 0}
                className="flex items-center justify-center gap-2 py-2.5 px-4 bg-neutral-800 hover:bg-neutral-700 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium rounded-xl text-xs transition-all border border-neutral-700 cursor-pointer"
              >
                <Minus className="w-4 h-4 text-neutral-300" />
                <span>Remove Last</span>
              </button>
            </div>

            {/* Custom Weight Increments */}
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => addGarment({ name: 'Bulk Garment', weight: 0.5, type: 'shirt' })}
                className="flex-1 py-1.5 px-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 rounded-lg text-xs font-mono tabular-nums transition-colors cursor-pointer text-center"
              >
                +0.5 kg
              </button>
              <button
                onClick={() => addGarment({ name: 'Heavy Garment', weight: 1.0, type: 'jeans' })}
                className="flex-1 py-1.5 px-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 rounded-lg text-xs font-mono tabular-nums transition-colors cursor-pointer text-center"
              >
                +1.0 kg
              </button>
              <button
                onClick={() => clearCompartment()}
                title="Clear current compartment"
                className="py-1.5 px-3 bg-neutral-900 hover:bg-red-950/40 border border-neutral-800 hover:border-red-900 text-neutral-400 hover:text-red-300 rounded-lg text-xs transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Current Stack in Liner List */}
            <div className="space-y-1.5 pt-2">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                Inside {activeCompartmentData.label} ({activeCompartmentData.garments.length} items)
              </div>
              <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                {activeCompartmentData.garments.length === 0 ? (
                  <div className="text-xs text-neutral-600 italic py-2">Compartment is empty (0.0 kg).</div>
                ) : (
                  activeCompartmentData.garments.map((g, idx) => (
                    <div
                      key={g.id}
                      className="flex items-center justify-between py-1.5 px-2.5 bg-neutral-950/40 rounded-lg text-xs border border-neutral-800/60"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: g.color }} />
                        <span className="text-neutral-300">{g.name}</span>
                      </div>
                      <span className="font-mono text-neutral-400 tabular-nums">{g.weight} kg</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PRESETS */}
        {activeTab === 'presets' && (
          <div className="space-y-3">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
              Demonstration Scenarios
            </div>

            {/* Preset B: Reference Match */}
            <button
              onClick={() => applyPreset('reference')}
              className="w-full p-3 bg-sky-950/20 hover:bg-sky-950/40 border border-sky-500/40 rounded-xl text-left transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-sky-400">Preset B · Authoritative Reference Image</span>
                <span className="text-[10px] font-mono bg-sky-900/60 text-sky-200 px-1.5 py-0.5 rounded">Exact Match</span>
              </div>
              <p className="text-[11px] text-neutral-300 mt-1">
                COLOURS selected · 2.6 kg load · Displays "HALF LOAD AVAILABLE" on OLED.
              </p>
            </button>

            {/* Preset A: Empty */}
            <button
              onClick={() => applyPreset('empty')}
              className="w-full p-3 bg-neutral-950/40 hover:bg-neutral-800/60 border border-neutral-800 rounded-xl text-left transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-200">Preset A · Empty Hamper</span>
                <span className="text-[10px] font-mono text-neutral-500">0.0 kg</span>
              </div>
              <p className="text-[11px] text-neutral-400 mt-1">
                All 3 bays at zero weight · OLED shows "WAIT / ADD LAUNDRY" in calm ice-cyan.
              </p>
            </button>

            {/* Preset C: Wash Ready */}
            <button
              onClick={() => applyPreset('wash_ready')}
              className="w-full p-3 bg-emerald-950/20 hover:bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-left transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400">Preset C · Wash Ready</span>
                <span className="text-[10px] font-mono bg-emerald-900/60 text-emerald-200 px-1.5 py-0.5 rounded">4.2 kg</span>
              </div>
              <p className="text-[11px] text-neutral-300 mt-1">
                84% capacity reached · Green positive chime · Displays "WASH NOW / LOAD READY".
              </p>
            </button>

            {/* Preset D: Overload */}
            <button
              onClick={() => applyPreset('overload')}
              className="w-full p-3 bg-red-950/20 hover:bg-red-950/40 border border-red-500/40 rounded-xl text-left transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-red-400">Preset D · Overload Warning</span>
                <span className="text-[10px] font-mono bg-red-900/60 text-red-200 px-1.5 py-0.5 rounded">5.4 kg</span>
              </div>
              <p className="text-[11px] text-neutral-300 mt-1">
                Exceeds 5.0 kg limit · Red LED alert · Displays "OVERLOAD / REMOVE CLOTHES".
              </p>
            </button>

            {/* Preset E: Damp Clothes */}
            <button
              onClick={() => applyPreset('damp_warning')}
              className="w-full p-3 bg-amber-950/20 hover:bg-amber-950/40 border border-amber-500/40 rounded-xl text-left transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400">Preset E · Possible Damp Clothes</span>
                <span className="text-[10px] font-mono bg-amber-900/60 text-amber-200 px-1.5 py-0.5 rounded">84% RH</span>
              </div>
              <p className="text-[11px] text-neutral-300 mt-1">
                Elevated moisture detection · Caution chime · Displays "POSSIBLE DAMP / CHECK CLOTHES".
              </p>
            </button>
          </div>
        )}

        {/* TAB 3: REMOVABLE LINERS */}
        {activeTab === 'liners' && (
          <div className="space-y-4">
            <div className="p-3 bg-neutral-950/40 rounded-xl border border-neutral-800 space-y-2">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                Removable Fabric Liners
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Each compartment contains an independent, washable fabric bag with integrated handles that lifts
                cleanly out of the hamper to carry straight to your washing machine.
              </p>
            </div>

            <div className="space-y-2">
              {compartments.map((comp) => {
                const isLifted = state.compartments[comp.id].isLinerLifted;
                return (
                  <div
                    key={comp.id}
                    className="flex items-center justify-between p-3 bg-neutral-900 rounded-xl border border-neutral-800"
                  >
                    <div>
                      <div className="text-xs font-bold text-white">{comp.label} Liner</div>
                      <div className="text-[11px] text-neutral-400">{comp.desc}</div>
                    </div>
                    <button
                      onClick={() => toggleLinerLift(comp.id)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                        isLifted
                          ? 'bg-sky-500 text-neutral-950 font-bold'
                          : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                      }`}
                    >
                      {isLifted ? 'Lower Liner' : 'Lift Liner'}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => {
                  toggleLinerLift('whites');
                  toggleLinerLift('colours');
                  toggleLinerLift('delicates');
                }}
                className="py-2 px-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium rounded-xl transition-colors cursor-pointer"
              >
                Toggle All Liners
              </button>
              <button
                onClick={resetAll}
                className="py-2 px-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium rounded-xl transition-colors cursor-pointer"
              >
                Reset Position
              </button>
            </div>
          </div>
        )}

        {/* TAB 4: MOISTURE & SENSOR TUNING */}
        {activeTab === 'sensors' && (
          <div className="space-y-4">
            {/* Humidity Slider */}
            <div className="p-3 bg-neutral-950/40 rounded-xl border border-neutral-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                  Simulated Relative Humidity
                </span>
                <span className="text-xs font-mono font-bold text-sky-400 tabular-nums">
                  {state.simulatedHumidity}% RH
                </span>
              </div>

              <input
                type="range"
                min="20"
                max="95"
                value={state.simulatedHumidity}
                onChange={(e) => setSimulatedHumidity(Number(e.target.value))}
                className="w-full accent-sky-400 cursor-pointer"
              />

              <div className="flex items-center justify-between text-[10px] text-neutral-500 font-mono">
                <span>20% (Dry)</span>
                <span>Threshold: {config.humidityWarningThreshold}%</span>
                <span>95% (Damp)</span>
              </div>

              {state.simulatedHumidity >= config.humidityWarningThreshold && !state.isHumidityAlertDismissed && (
                <div className="flex items-center justify-between p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                  <span className="text-[11px] text-amber-300 font-medium">Moisture alert active</span>
                  <button
                    onClick={dismissHumidityAlert}
                    className="px-2 py-0.5 bg-amber-500 text-neutral-950 text-[10px] font-bold rounded cursor-pointer"
                  >
                    Clear Alert
                  </button>
                </div>
              )}
            </div>

            {/* Threshold Configuration */}
            <div className="p-3 bg-neutral-950/40 rounded-xl border border-neutral-800 space-y-3">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                Configurable Thresholds
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs text-neutral-300">
                  <span>Bay Capacity</span>
                  <span className="font-mono text-neutral-400">{config.compartmentCapacity.toFixed(1)} kg</span>
                </div>
                <input
                  type="range"
                  min="3.0"
                  max="8.0"
                  step="0.5"
                  value={config.compartmentCapacity}
                  onChange={(e) => updateConfig({ compartmentCapacity: Number(e.target.value) })}
                  className="w-full accent-neutral-400 cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs text-neutral-300">
                  <span>Half-Load Threshold</span>
                  <span className="font-mono text-neutral-400">{Math.round(config.halfLoadRatio * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.3"
                  max="0.7"
                  step="0.05"
                  value={config.halfLoadRatio}
                  onChange={(e) => updateConfig({ halfLoadRatio: Number(e.target.value) })}
                  className="w-full accent-neutral-400 cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs text-neutral-300">
                  <span>Wash-Ready Threshold</span>
                  <span className="font-mono text-neutral-400">{Math.round(config.washReadyRatio * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.6"
                  max="0.95"
                  step="0.05"
                  value={config.washReadyRatio}
                  onChange={(e) => updateConfig({ washReadyRatio: Number(e.target.value) })}
                  className="w-full accent-neutral-400 cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Dock Footer: Total System Summary */}
      <div className="p-3 border-t border-neutral-800 bg-neutral-950/80 flex items-center justify-between text-xs text-neutral-400">
        <div>
          <span>Total Hamper Load: </span>
          <span className="font-mono font-bold text-white tabular-nums">{totalWeight.toFixed(1)} kg</span>
        </div>
        <div className="font-mono text-neutral-400">
          <span>{totalGarmentsCount} items total</span>
        </div>
      </div>
    </div>
  );
};
