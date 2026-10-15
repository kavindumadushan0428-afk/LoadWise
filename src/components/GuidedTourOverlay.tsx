import React from 'react';
import { Play, Pause, ChevronRight, ChevronLeft, X, Sparkles } from 'lucide-react';
import { useSimulation } from '../simulation/SimulationContext';

const TOUR_STEPS = [
  {
    title: '1. Industrial Design & Proportions',
    description:
      'LoadWise features a dual-tone consumer appliance body with soft-radiused corners, dark charcoal base, and three distinct laundry sorting bays.',
  },
  {
    title: '2. 360° Inspection & Rear Details',
    description:
      'Notice the rear IEC C14 universal power inlet, dual ventilation cooling grilles, and recessed side carry handles.',
  },
  {
    title: '3. Three Dedicated Sorting Bays',
    description:
      'Left: Whites (Ivory linen). Center: Colours (Slate-blue twill). Right: Delicates (Dusty-rose cotton). Each with its own strain-gauge load cell.',
  },
  {
    title: '4. OLED Display & Tactile Rotary Dial',
    description:
      'High-contrast black glass OLED console paired with an anodized metallic rotary knob and emissive status LED light bars.',
  },
  {
    title: '5. Baseline State — "WAIT / ADD LAUNDRY"',
    description:
      'When empty (0.0 kg), the OLED shows a calm ice-cyan interface indicating the hamper is ready for sorting.',
  },
  {
    title: '6. Rotary Dial Navigation',
    description:
      'Rotating the physical dial selects compartments with realistic tactile clicks, illuminating the corresponding bay indicator.',
  },
  {
    title: '7. Reference Image State (2.6 kg)',
    description:
      'Exactly reproducing the user reference photograph: COLOURS bay loaded to 2.6 kg displaying "HALF LOAD AVAILABLE" on OLED.',
  },
  {
    title: '8. Wash Ready Recommendation',
    description:
      'Reaching 80% capacity triggers positive green feedback with "WASH NOW / LOAD READY" indicating an optimal wash cycle.',
  },
  {
    title: '9. Overload Warning & Safe Recovery',
    description:
      'Exceeding 5.0 kg capacity triggers a bold red OLED alert and double beep. Removing garments immediately clears the alert.',
  },
  {
    title: '10. Capacitive Moisture Sensing',
    description:
      'Simulated elevated humidity triggers "POSSIBLE DAMP CLOTHES" to prevent mildew build-up from damp towels or sportswear.',
  },
  {
    title: '11. Removable Fabric Liners',
    description:
      'Each liner lifts smoothly with integrated carry loops so you can transport sorted loads directly to your washer without sorting twice.',
  },
  {
    title: '12. Ready for UX Testing & Free Exploration',
    description:
      'Tour complete! Explore freely, manipulate the 3D model, add custom laundry, or run the UX Evaluation mode.',
  },
];

export const GuidedTourOverlay: React.FC = () => {
  const {
    isTourActive,
    tourStep,
    nextTourStep,
    prevTourStep,
    exitGuidedTour,
  } = useSimulation();

  if (!isTourActive) return null;

  const currentStep = TOUR_STEPS[tourStep] || TOUR_STEPS[0];
  const totalSteps = TOUR_STEPS.length;
  const progressPercent = ((tourStep + 1) / totalSteps) * 100;

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 w-full max-w-2xl px-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="p-4 bg-neutral-900/95 backdrop-blur-md rounded-2xl border border-neutral-700/80 shadow-2xl text-white">
        {/* Progress Bar */}
        <div className="w-full h-1 bg-neutral-800 rounded-full mb-3 overflow-hidden">
          <div
            className="h-full bg-sky-400 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-mono tracking-wider text-sky-400 uppercase font-semibold">
                Guided Demonstration · Step {tourStep + 1} of {totalSteps}
              </span>
            </div>
            <h4 className="text-sm font-bold text-white tracking-wide">{currentStep.title}</h4>
            <p className="text-xs text-neutral-300 mt-1 leading-relaxed">{currentStep.description}</p>
          </div>

          {/* Close / Exit Button */}
          <button
            onClick={exitGuidedTour}
            className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
            title="Exit Tour"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-neutral-800">
          <button
            onClick={prevTourStep}
            disabled={tourStep === 0}
            className="flex items-center gap-1 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg text-xs font-medium transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Previous</span>
          </button>

          <div className="text-[11px] text-neutral-500 font-mono">
            {tourStep + 1} / {totalSteps}
          </div>

          <div className="flex items-center gap-2">
            {tourStep < totalSteps - 1 ? (
              <button
                onClick={nextTourStep}
                className="flex items-center gap-1 px-3.5 py-1.5 bg-sky-400 hover:bg-sky-300 text-neutral-950 font-bold rounded-lg text-xs transition-colors cursor-pointer"
              >
                <span>Next Step</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={exitGuidedTour}
                className="flex items-center gap-1 px-3.5 py-1.5 bg-sky-400 hover:bg-sky-300 text-neutral-950 font-bold rounded-lg text-xs transition-colors cursor-pointer"
              >
                <span>Finish Tour</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
