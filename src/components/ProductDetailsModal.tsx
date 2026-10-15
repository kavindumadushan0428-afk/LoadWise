import React from 'react';
import { X, Package, Shield, Zap, Compass, Info } from 'lucide-react';

interface ProductDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl text-white overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-800">
          <div>
            <span className="text-[10px] font-mono tracking-widest text-sky-400 uppercase font-semibold">
              Industrial Design & CMF
            </span>
            <h3 className="text-lg font-bold text-white mt-0.5">Product Specifications</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-neutral-300">
          {/* Dimensions & Form Factor */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-2">
              <Package className="w-4 h-4 text-sky-400" />
              <span>Physical Dimensions & Proportions</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 bg-neutral-950/60 rounded-xl border border-neutral-800">
                <div className="text-[10px] text-neutral-500 uppercase">Width</div>
                <div className="text-base font-bold font-mono text-white mt-0.5">880 mm</div>
                <div className="text-[10px] text-neutral-500">3-Bay Span</div>
              </div>
              <div className="p-3 bg-neutral-950/60 rounded-xl border border-neutral-800">
                <div className="text-[10px] text-neutral-500 uppercase">Height</div>
                <div className="text-base font-bold font-mono text-white mt-0.5">420 mm</div>
                <div className="text-[10px] text-neutral-500">Chassis + Base</div>
              </div>
              <div className="p-3 bg-neutral-950/60 rounded-xl border border-neutral-800">
                <div className="text-[10px] text-neutral-500 uppercase">Depth</div>
                <div className="text-base font-bold font-mono text-white mt-0.5">390 mm</div>
                <div className="text-[10px] text-neutral-500">Front to Back</div>
              </div>
              <div className="p-3 bg-neutral-950/60 rounded-xl border border-neutral-800">
                <div className="text-[10px] text-neutral-500 uppercase">Capacity</div>
                <div className="text-base font-bold font-mono text-white mt-0.5">15.0 kg</div>
                <div className="text-[10px] text-neutral-500">3 × 5.0 kg bays</div>
              </div>
            </div>
          </div>

          {/* Color, Material, Finish (CMF) */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-2">
              <Compass className="w-4 h-4 text-sky-400" />
              <span>Color, Material & Finish (CMF)</span>
            </h4>
            <div className="space-y-2">
              <div className="p-3 bg-neutral-950/60 rounded-xl border border-neutral-800 flex items-start justify-between">
                <div>
                  <span className="font-semibold text-white">Main Upper Shell:</span>
                  <p className="text-neutral-400 text-[11px] mt-0.5">
                    Injection-molded warm-white ABS/Polycarbonate blend with fine satin texture (VDI 24).
                  </p>
                </div>
                <span className="text-[10px] font-mono bg-neutral-800 text-neutral-300 px-2 py-0.5 rounded">
                  Warm White #EDEAE3
                </span>
              </div>

              <div className="p-3 bg-neutral-950/60 rounded-xl border border-neutral-800 flex items-start justify-between">
                <div>
                  <span className="font-semibold text-white">Sub-Chassis Lower Base:</span>
                  <p className="text-neutral-400 text-[11px] mt-0.5">
                    Structural dark charcoal polymer with recessed ventilation louvres and embossed LoadWise logo.
                  </p>
                </div>
                <span className="text-[10px] font-mono bg-neutral-800 text-neutral-300 px-2 py-0.5 rounded">
                  Charcoal #272B30
                </span>
              </div>

              <div className="p-3 bg-neutral-950/60 rounded-xl border border-neutral-800 flex items-start justify-between">
                <div>
                  <span className="font-semibold text-white">Rotary Encoder Dial:</span>
                  <p className="text-neutral-400 text-[11px] mt-0.5">
                    Diamond-knurled CNC machined aluminum with dark anodization, chamfered edge, and sunken brushed cap.
                  </p>
                </div>
                <span className="text-[10px] font-mono bg-neutral-800 text-neutral-300 px-2 py-0.5 rounded">
                  Brushed Al 6061
                </span>
              </div>

              <div className="p-3 bg-neutral-950/60 rounded-xl border border-neutral-800 flex items-start justify-between">
                <div>
                  <span className="font-semibold text-white">Fabric Liners:</span>
                  <p className="text-neutral-400 text-[11px] mt-0.5">
                    Organic cotton-twill blend (Ivory for Whites, Slate-Blue for Colours, Dusty-Rose for Delicates) with reinforced handles.
                  </p>
                </div>
                <span className="text-[10px] font-mono bg-neutral-800 text-neutral-300 px-2 py-0.5 rounded">
                  Machine-Wash 40°C
                </span>
              </div>
            </div>
          </div>

          {/* Electronics & Power */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-2">
              <Zap className="w-4 h-4 text-sky-400" />
              <span>Electrical & Connectivity</span>
            </h4>
            <div className="grid sm:grid-cols-2 gap-2.5">
              <div className="p-3 bg-neutral-950/60 rounded-xl border border-neutral-800">
                <span className="font-semibold text-white">Power Supply:</span>
                <p className="text-neutral-400 text-[11px] mt-0.5">
                  Universal IEC C14 100–240V AC 50/60Hz inlet socket (low power standby &lt; 0.5W).
                </p>
              </div>

              <div className="p-3 bg-neutral-950/60 rounded-xl border border-neutral-800">
                <span className="font-semibold text-white">Display System:</span>
                <p className="text-neutral-400 text-[11px] mt-0.5">
                  High-contrast PMOLED 3.2" portrait monochrome display with wide viewing angles and anti-reflective cover glass.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-950/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
          >
            Close Specifications
          </button>
        </div>
      </div>
    </div>
  );
};
