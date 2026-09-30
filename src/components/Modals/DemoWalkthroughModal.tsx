/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * HEXA-R 3-Minute Demo Walkthrough Modal
 * Whitish-black styling with bold black typography, floating step cards,
 * and 12-step verification and Snapdragon NPU demo flow.
 */

import React from 'react';
import { 
  Zap, 
  X, 
  ArrowRight, 
  RotateCcw
} from 'lucide-react';

interface DemoWalkthroughModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStepAction: (stepNumber: number) => void;
  onResetDemo: () => void;
}

export const DEMO_STEPS = [
  { step: 1, title: 'Open UART Project', desc: 'Inspect full-duplex UART controller with parameterized baud generation.' },
  { step: 2, title: 'Inspect RTL in Editor', desc: 'View uart_rx.sv, uart_tx.sv, and uart_top.sv with real-time static analysis.' },
  { step: 3, title: 'Generate Testbench', desc: 'AI extracts ports, creates clock/reset stimulus, and synthesizes formal SVA assertions.' },
  { step: 4, title: 'Inspect Generated Testbench', desc: 'Review directed test cases, boundary tests, and waveform dump calls.' },
  { step: 5, title: 'Click "VERIFY RTL"', desc: 'Runs static analysis, compiler elaboration, cycle-accurate simulation, and waveform generation.' },
  { step: 6, title: 'Detect Simulation Bug', desc: 'Simulation flags a framing error at t=360ns and fails assert_no_spurious_framing.' },
  { step: 7, title: 'HEXA-R Explains Root Cause', desc: 'Local AI identifies receiver sampling input one clock cycle late (sample_cnt == CLKS_PER_BIT).' },
  { step: 8, title: 'AI Generates Correction', desc: 'Proposes clock boundary fix to (CLKS_PER_BIT - 1) to restore synchronous phase.' },
  { step: 9, title: 'Review Code Diff', desc: 'Side-by-side GitHub-style diff shows precise single-line timing fix.' },
  { step: 10, title: 'Apply Fix', desc: 'One-click application updates uart_rx.sv with zero manual syntax errors.' },
  { step: 11, title: 'Re-run VERIFY RTL', desc: 'All 48/48 tests pass! Waveform shows zero framing errors and 17/17 assertions green.' },
  { step: 12, title: 'Snapdragon NPU Center', desc: 'Show 100% on-device execution on Qualcomm Hexagon NPU with zero cloud transmission.' },
];

export const DemoWalkthroughModal: React.FC<DemoWalkthroughModalProps> = ({
  isOpen,
  onClose,
  onStepAction,
  onResetDemo,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="bg-white border-2 border-black rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden text-black font-mono text-xs animate-modal-float">
        
        {/* Header (Crisp White with Bold Black Text) */}
        <div className="h-14 px-5 bg-white border-b-2 border-black flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="p-2 rounded-xl bg-black text-white">
              <Zap className="w-5 h-5 text-amber-400 fill-amber-400" />
            </span>
            <div>
              <h3 className="font-black text-sm text-black uppercase tracking-tight">3-MINUTE HACKATHON DEMO WALKTHROUGH</h3>
              <p className="text-[11px] text-black font-bold">Step-by-step verification pipeline & Snapdragon NPU showcase</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onResetDemo}
              className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-black border-2 border-black flex items-center gap-1.5 text-xs font-black cursor-pointer transition-colors"
              title="Reset project to buggy state"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Bug</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-black hover:bg-slate-100 rounded-lg border-2 border-black cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-white">
          <div className="p-3 bg-amber-50 rounded-xl border-2 border-black text-xs text-black font-bold">
            <span className="font-black uppercase tracking-wider text-[10px] bg-amber-300 px-1.5 py-0.5 rounded border border-black mr-1">
              DEMO GUIDE:
            </span>
            Click on any step below to automatically navigate and trigger that action in HEXA-R.
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {DEMO_STEPS.map(s => (
              <div
                key={s.step}
                onClick={() => {
                  onStepAction(s.step);
                  onClose();
                }}
                className="floating-card p-3 rounded-xl bg-white border-2 border-black flex items-center justify-between cursor-pointer group"
              >
                <div className="flex items-center space-x-3">
                  <span className="w-7 h-7 rounded-full bg-black text-white font-black flex items-center justify-center text-xs flex-shrink-0">
                    {s.step}
                  </span>
                  <div>
                    <h4 className="font-black text-xs text-black group-hover:underline">
                      {s.title}
                    </h4>
                    <p className="text-[11px] text-black font-bold mt-0.5">{s.desc}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-1 text-black font-black text-xs opacity-70 group-hover:opacity-100 pl-2">
                  <span className="hidden sm:inline">Run</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="h-12 px-5 bg-white border-t-2 border-black flex items-center justify-between text-xs text-black font-bold">
          <span className="font-black">Qualcomm Hexagon NPU Demonstration Mode</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-black text-white font-black hover:bg-slate-800 cursor-pointer shadow-xs"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
