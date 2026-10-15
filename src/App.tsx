import React, { useState } from 'react';
import { SimulationProvider, useSimulation } from './simulation/SimulationContext';
import { Header } from './components/Header';
import { Viewer3D } from './components/Viewer3D';
import { ControlDock } from './components/ControlDock';
import { GuidedTourOverlay } from './components/GuidedTourOverlay';
import { HowItWorksModal } from './components/HowItWorksModal';
import { ProductDetailsModal } from './components/ProductDetailsModal';
import { UxTestingPanel } from './components/UxTestingPanel';

const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'explore' | 'simulation' | 'how-it-works' | 'specs' | 'ux-testing'>('explore');

  return (
    <div className="flex flex-col h-screen w-screen bg-neutral-950 text-neutral-100 overflow-hidden font-sans">
      {/* Top Navigation Bar */}
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Interactive Product Viewport & Dock Split */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Left / Center 3D Viewer Canvas */}
        <div className="flex-1 h-[55vh] lg:h-full relative overflow-hidden">
          <Viewer3D />
          <GuidedTourOverlay />
        </div>

        {/* Right Interactive Control Dock */}
        <ControlDock />
      </main>

      {/* Overlay Modals */}
      <HowItWorksModal
        isOpen={activeTab === 'how-it-works'}
        onClose={() => setActiveTab('explore')}
      />

      <ProductDetailsModal
        isOpen={activeTab === 'specs'}
        onClose={() => setActiveTab('explore')}
      />

      <UxTestingPanel
        isOpen={activeTab === 'ux-testing'}
        onClose={() => setActiveTab('explore')}
      />
    </div>
  );
};

export function App() {
  return (
    <SimulationProvider>
      <AppContent />
    </SimulationProvider>
  );
}

export default App;
