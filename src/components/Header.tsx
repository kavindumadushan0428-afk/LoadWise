import React from 'react';
import { Volume2, VolumeX, Play, RotateCcw } from 'lucide-react';
import { useSimulation } from '../simulation/SimulationContext';

interface HeaderProps {
  activeTab: 'explore' | 'simulation' | 'how-it-works' | 'specs' | 'ux-testing';
  setActiveTab: (tab: 'explore' | 'simulation' | 'how-it-works' | 'specs' | 'ux-testing') => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {
  const {
    state,
    toggleAudioMute,
    startGuidedTour,
    resetAll,
    setCameraView,
  } = useSimulation();

  return (
    <header className="flex items-center justify-between gap-8 px-6 py-3.5 bg-neutral-900 border-b border-neutral-800 text-white select-none z-30">
      {/* Zone 1: Brand wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={() => {
            setActiveTab('explore');
            setCameraView('hero');
          }}
          className="text-lg font-bold tracking-widest text-neutral-100 hover:text-white transition-colors uppercase cursor-pointer"
        >
          LOADWISE
        </button>
        <span className="text-xs tracking-wider text-neutral-500 hidden sm:inline">
          SMART LAUNDRY BASKET
        </span>
      </div>

      {/* Zone 2: Navigation Links */}
      <nav className="hidden md:flex items-center gap-6 text-xs tracking-wider uppercase font-medium text-neutral-400">
        <button
          onClick={() => {
            setActiveTab('explore');
            setCameraView('hero');
          }}
          className={`hover:text-white transition-colors whitespace-nowrap py-1 cursor-pointer ${
            activeTab === 'explore' ? 'text-white border-b-2 border-sky-400' : ''
          }`}
        >
          Explore
        </button>

        <button
          onClick={() => {
            setActiveTab('simulation');
          }}
          className={`hover:text-white transition-colors whitespace-nowrap py-1 cursor-pointer ${
            activeTab === 'simulation' ? 'text-white border-b-2 border-sky-400' : ''
          }`}
        >
          Live Simulation
        </button>

        <button
          onClick={() => setActiveTab('how-it-works')}
          className={`hover:text-white transition-colors whitespace-nowrap py-1 cursor-pointer ${
            activeTab === 'how-it-works' ? 'text-white border-b-2 border-sky-400' : ''
          }`}
        >
          How It Works
        </button>

        <button
          onClick={() => setActiveTab('specs')}
          className={`hover:text-white transition-colors whitespace-nowrap py-1 cursor-pointer ${
            activeTab === 'specs' ? 'text-white border-b-2 border-sky-400' : ''
          }`}
        >
          Product Details
        </button>

        <button
          onClick={() => setActiveTab('ux-testing')}
          className={`hover:text-white transition-colors whitespace-nowrap py-1 cursor-pointer ${
            activeTab === 'ux-testing' ? 'text-white border-b-2 border-sky-400' : ''
          }`}
        >
          UX Testing
        </button>
      </nav>

      {/* Zone 3: Primary Actions */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Reset System */}
        <button
          onClick={resetAll}
          title="Reset to default reference state"
          className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Audio Mute / Unmute */}
        <button
          onClick={toggleAudioMute}
          title={state.audioMuted ? 'Unmute Audio' : 'Mute Audio'}
          className={`p-2 rounded-lg transition-colors cursor-pointer ${
            state.audioMuted
              ? 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800'
              : 'text-sky-400 hover:text-sky-300 hover:bg-neutral-800'
          }`}
        >
          {state.audioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>

        {/* Primary CTA: Guided Tour */}
        <button
          onClick={() => {
            setActiveTab('explore');
            startGuidedTour();
          }}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold tracking-wide text-neutral-900 bg-sky-400 hover:bg-sky-300 active:scale-95 rounded-lg transition-all shadow-sm cursor-pointer whitespace-nowrap"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Start Guided Demo</span>
        </button>
      </div>
    </header>
  );
};
