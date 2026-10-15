import React from 'react';
import { X, Scale, Cpu, Droplets, CheckCircle, AlertCircle } from 'lucide-react';

interface HowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowItWorksModal: React.FC<HowItWorksModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl text-white overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-800">
          <div>
            <span className="text-[10px] font-mono tracking-widest text-sky-400 uppercase font-semibold">
              System Architecture & Methodology
            </span>
            <h3 className="text-lg font-bold text-white mt-0.5">How LoadWise Works</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-neutral-300 leading-relaxed">
          {/* Honest Concept Summary */}
          <div className="p-4 bg-sky-950/20 border border-sky-500/30 rounded-xl space-y-1.5">
            <h4 className="text-sm font-semibold text-sky-300">Presorted Ergonomics & Active Load Sensing</h4>
            <p className="text-neutral-300">
              LoadWise is a smart residential laundry hamper designed to eliminate wash-day sorting fatigue. Users manually
              place garments into one of three dedicated compartments: <strong>Whites</strong>, <strong>Colours</strong>,
              or <strong>Delicates</strong>. High-precision simulated strain-gauge load cells beneath each bay track load
              accumulation in real time, advising users when an optimal washer load is ready.
            </p>
          </div>

          {/* Core Hardware Subsystems */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="p-4 bg-neutral-950/50 rounded-xl border border-neutral-800 space-y-2">
              <div className="flex items-center gap-2 text-white font-semibold">
                <Scale className="w-4 h-4 text-sky-400" />
                <span>Strain-Gauge Load Cells</span>
              </div>
              <p className="text-neutral-400">
                Four planar strain gauges under each bay measure accumulated laundry mass. Simulated digital filtering
                cancels transient vibrations, providing stable 0.1 kg incremental readouts.
              </p>
            </div>

            <div className="p-4 bg-neutral-950/50 rounded-xl border border-neutral-800 space-y-2">
              <div className="flex items-center gap-2 text-white font-semibold">
                <Cpu className="w-4 h-4 text-sky-400" />
                <span>OLED & Tactile Rotary Console</span>
              </div>
              <p className="text-neutral-400">
                A vertically centered high-contrast OLED display pairs with a physical rotary dial. Users select bays with
                crisp tactile clicks and inspect current weight, load recommendations, and alerts.
              </p>
            </div>

            <div className="p-4 bg-neutral-950/50 rounded-xl border border-neutral-800 space-y-2">
              <div className="flex items-center gap-2 text-white font-semibold">
                <Droplets className="w-4 h-4 text-sky-400" />
                <span>Capacitive Moisture Sensing</span>
              </div>
              <p className="text-neutral-400">
                Simulated relative humidity sensors in the basket base detect moisture spikes above 72% RH, warning against
                mildew growth if damp towels or workout clothes are enclosed.
              </p>
            </div>

            <div className="p-4 bg-neutral-950/50 rounded-xl border border-neutral-800 space-y-2">
              <div className="flex items-center gap-2 text-white font-semibold">
                <CheckCircle className="w-4 h-4 text-sky-400" />
                <span>Removable Machine-Wash Liners</span>
              </div>
              <p className="text-neutral-400">
                Individual fabric liners (ivory, slate-blue, dusty-rose) with reinforced carry loops lift effortlessly out of the
                chassis, enabling one-trip transfer directly to the drum.
              </p>
            </div>
          </div>

          {/* Academic Prototype Transparency Note */}
          <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs uppercase tracking-wider">
              <AlertCircle className="w-4 h-4" />
              <span>Academic Prototype Transparency & Boundaries</span>
            </div>
            <p className="text-neutral-400 text-[11px] leading-relaxed">
              This interactive application is a high-fidelity 3D interaction prototype developed for university UX and product
              design evaluation. While designed to consumer-grade mechanical specifications, this prototype runs on deterministic
              simulation logic:
            </p>
            <ul className="list-disc list-inside space-y-1 text-neutral-400 text-[11px]">
              <li>Laundry sorting is manual (not computer vision automated garment categorization).</li>
              <li>LoadWise is a smart sorting hamper, not a built-in washing machine or mechanical tumbler.</li>
              <li>Moisture alerts reflect simulated environmental triggers rather than calibrated wet-fabric spectroscopy.</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-950/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
          >
            Close Overview
          </button>
        </div>
      </div>
    </div>
  );
};
