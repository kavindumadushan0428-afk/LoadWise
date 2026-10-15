import React, { useState } from 'react';
import {
  CheckCircle2,
  Circle,
  Play,
  RotateCcw,
  Download,
  Copy,
  Clock,
  Check,
  FileText,
  UserCheck,
} from 'lucide-react';
import { useSimulation } from '../simulation/SimulationContext';

interface UxTestingPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UxTestingPanel: React.FC<UxTestingPanelProps> = ({ isOpen, onClose }) => {
  const {
    tasks,
    startTask,
    completeTask,
    resetTasks,
    exportTestReport,
  } = useSimulation();

  const [copied, setCopied] = useState<boolean>(false);
  const [participantId, setParticipantId] = useState<string>('P-01');
  const [evaluatorNotes, setEvaluatorNotes] = useState<string>('');

  if (!isOpen) return null;

  const completedCount = tasks.filter((t) => t.completed).length;
  const progressPercent = Math.round((completedCount / tasks.length) * 100);

  const handleCopyReport = () => {
    const report = exportTestReport();
    navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadReport = () => {
    const report = exportTestReport();
    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `LoadWise_UX_Evaluation_${participantId}_${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl text-white overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-neutral-800 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono tracking-widest text-sky-400 uppercase font-semibold">
                Usability Evaluation & Assignment Testing
              </span>
            </div>
            <h3 className="text-lg font-bold text-white mt-0.5">LoadWise UX Task Suite</h3>
          </div>

          <div className="flex items-center gap-3">
            {/* Progress Badge */}
            <div className="flex items-center gap-2 px-3 py-1 bg-neutral-800 rounded-lg text-xs font-mono">
              <span className="text-neutral-400">Score:</span>
              <span className="text-sky-400 font-bold">{completedCount} / {tasks.length}</span>
              <span className="text-neutral-500">({progressPercent}%)</span>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Scrollable Tasks */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Participant Info Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-3 bg-neutral-950/60 rounded-xl border border-neutral-800">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-sky-400" />
              <span className="font-semibold text-neutral-300">Participant ID:</span>
              <input
                type="text"
                value={participantId}
                onChange={(e) => setParticipantId(e.target.value)}
                className="w-24 px-2 py-1 bg-neutral-900 border border-neutral-700 rounded text-xs font-mono text-white"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={resetTasks}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset All Tasks</span>
              </button>
            </div>
          </div>

          {/* Task List */}
          <div className="space-y-3">
            {tasks.map((task) => (
              <div
                key={task.id}
                className={`p-4 rounded-xl border transition-all ${
                  task.completed
                    ? 'bg-emerald-950/15 border-emerald-500/40'
                    : task.active
                    ? 'bg-sky-950/20 border-sky-500/50 shadow-md'
                    : 'bg-neutral-950/40 border-neutral-800'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => (task.completed ? null : completeTask(task.id))}
                      className="mt-0.5 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                    >
                      {task.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <Circle className="w-5 h-5 text-neutral-600" />
                      )}
                    </button>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-xs">
                          Task {task.id}: {task.title}
                        </span>
                        {task.active && !task.completed && (
                          <span className="text-[10px] bg-sky-900/60 text-sky-300 px-1.5 py-0.2 rounded font-mono">
                            IN PROGRESS
                          </span>
                        )}
                        {task.completed && (
                          <span className="text-[10px] bg-emerald-900/60 text-emerald-300 px-1.5 py-0.2 rounded font-mono">
                            COMPLETED
                          </span>
                        )}
                      </div>

                      <p className="text-neutral-300 text-xs mt-1 leading-relaxed">
                        {task.instruction}
                      </p>

                      <div className="text-[11px] text-neutral-500 mt-1.5 font-mono">
                        Target Verification: {task.targetCriteria}
                      </div>
                    </div>
                  </div>

                  {/* Task Timer & Start Button */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1 text-neutral-400 font-mono text-[11px] bg-neutral-900 px-2 py-1 rounded">
                      <Clock className="w-3 h-3 text-neutral-500" />
                      <span>{task.timeSpentSeconds}s</span>
                    </div>

                    {!task.active && !task.completed && (
                      <button
                        onClick={() => startTask(task.id)}
                        className="flex items-center gap-1 px-2.5 py-1 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Start</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Evaluator Notes Field */}
          <div className="space-y-2">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
              Evaluator Observations & Usability Notes
            </label>
            <textarea
              rows={3}
              placeholder="Record participant feedback, latency observations, or navigation friction notes..."
              value={evaluatorNotes}
              onChange={(e) => setEvaluatorNotes(e.target.value)}
              className="w-full p-3 bg-neutral-950/70 border border-neutral-800 rounded-xl text-neutral-200 text-xs focus:outline-hidden focus:border-sky-500/60"
            />
          </div>
        </div>

        {/* Footer / Export Actions */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-950/60 flex items-center justify-between">
          <div className="text-[11px] text-neutral-400">
            University UX Testing Framework · Auto-verification active
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyReport}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-medium transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Summary'}</span>
            </button>

            <button
              onClick={handleDownloadReport}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-sky-400 hover:bg-sky-300 text-neutral-950 font-bold rounded-lg text-xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Test Report (.txt)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
