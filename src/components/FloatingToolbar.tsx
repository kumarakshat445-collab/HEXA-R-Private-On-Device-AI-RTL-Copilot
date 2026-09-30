/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * HEXA-R Floating Action System
 * White glassmorphic floating control capsule with deep black bold typography
 * and ultra-smooth floating keyframe animation.
 */

import React from 'react';
import { 
  Play, 
  Sparkles, 
  Wand2, 
  Activity, 
  ShieldCheck, 
  Loader2, 
  Zap, 
  PanelRight
} from 'lucide-react';
import { RTLDiagnostic, SimulationResult } from '../types';

interface FloatingToolbarProps {
  isVerifying: boolean;
  simResult: SimulationResult | null;
  diagnostics: RTLDiagnostic[];
  isBottomPanelOpen: boolean;
  isRightCopilotOpen: boolean;
  onVerifyRtl: () => void;
  onGenerateRtl: () => void;
  onToggleBottomPanel: () => void;
  onToggleCopilot: () => void;
  onOpenDiffModal: () => void;
  onOpenNpuCenter: () => void;
  onOpenPrivacyCenter: () => void;
  onRunDemoFlow: () => void;
}

export const FloatingToolbar: React.FC<FloatingToolbarProps> = ({
  isVerifying,
  simResult,
  isBottomPanelOpen,
  isRightCopilotOpen,
  onVerifyRtl,
  onGenerateRtl,
  onToggleBottomPanel,
  onToggleCopilot,
  onOpenDiffModal,
  onOpenNpuCenter,
  onOpenPrivacyCenter,
  onRunDemoFlow,
}) => {
  const hasTimingError = simResult && !simResult.success;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 select-none pointer-events-auto">
      <div className="animate-float-capsule">
        <div className="floating-island rounded-full px-4 py-2.5 flex items-center space-x-3 bg-white/98 border-2 border-black shadow-2xl">
          
          {/* 1. Primary Action: VERIFY RTL (Floating bold black button with white bold text) */}
          <button
            onClick={onVerifyRtl}
            disabled={isVerifying}
            className="floating-button px-5 py-2 rounded-full bg-black hover:bg-slate-800 disabled:opacity-50 text-white font-black text-xs shadow-md flex items-center gap-2 group cursor-pointer tracking-wider"
            title="Run parsing, static analysis, compile, simulation & AI review"
          >
            {isVerifying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span className="font-black">VERIFYING...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white group-hover:scale-110 transition-transform" />
                <span className="font-black">VERIFY RTL</span>
              </>
            )}
          </button>

          {/* 2. Floating Auto-Fix Pill (shows when bug is detected) */}
          {hasTimingError && (
            <button
              onClick={onOpenDiffModal}
              className="floating-button px-4 py-2 rounded-full bg-amber-400 hover:bg-amber-300 text-black border-2 border-black font-black text-xs shadow-md flex items-center gap-1.5 animate-pulse cursor-pointer"
              title="Timing error detected in uart_rx.sv - Click to review diff & auto-fix"
            >
              <Wand2 className="w-4 h-4 text-black" />
              <span className="font-black">AUTO-FIX DETECTED BUG</span>
            </button>
          )}

          <div className="h-6 w-0.5 bg-black/20 hidden sm:block" />

          {/* 3. Generate RTL with Natural Language */}
          <button
            onClick={onGenerateRtl}
            className="floating-button px-3.5 py-1.5 rounded-full bg-white hover:bg-slate-100 text-black border-2 border-black font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
            title="Synthesize SystemVerilog modules from natural language specifications"
          >
            <Sparkles className="w-3.5 h-3.5 text-black" />
            <span className="font-black hidden md:inline">Generate RTL</span>
          </button>

          {/* 4. Waveform & Terminal Drawer Toggle */}
          <button
            onClick={onToggleBottomPanel}
            className={`floating-button px-3.5 py-1.5 rounded-full border-2 border-black text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-xs ${
              isBottomPanelOpen
                ? 'bg-black text-white'
                : 'bg-white hover:bg-slate-100 text-black'
            }`}
            title="Toggle VCD Waveform Viewer and Compiler Console"
          >
            <Activity className={`w-3.5 h-3.5 ${isBottomPanelOpen ? 'text-white' : 'text-black'}`} />
            <span className="font-black hidden sm:inline">Waveform</span>
            {hasTimingError && (
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse border border-white" />
            )}
          </button>

          {/* 5. 3-Minute Demo Flow Guide */}
          <button
            onClick={onRunDemoFlow}
            className="floating-button px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-black border-2 border-black font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
            title="Launch 3-minute hackathon demo walkthrough"
          >
            <Zap className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
            <span className="font-black hidden lg:inline">Demo Tour</span>
          </button>

          {/* 6. AI Copilot Toggle */}
          <button
            onClick={onToggleCopilot}
            className={`floating-button p-2 rounded-full border-2 border-black cursor-pointer shadow-xs ${
              isRightCopilotOpen
                ? 'bg-black text-white'
                : 'bg-white hover:bg-slate-100 text-black'
            }`}
            title="Toggle HEXA-R Copilot Drawer"
          >
            <PanelRight className="w-4 h-4" />
          </button>

          {/* 7. Snapdragon NPU Indicator Badge with subtle floating bob */}
          <button
            onClick={onOpenNpuCenter}
            className="floating-button px-3 py-1.5 rounded-full bg-emerald-100 hover:bg-emerald-200 border-2 border-black text-xs text-black font-black flex items-center gap-1.5 cursor-pointer shadow-xs"
            title="Qualcomm Hexagon NPU is active locally. Click to open NPU Center."
          >
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse"></span>
            <span className="font-black text-black hidden xl:inline">HEXAGON NPU</span>
          </button>

          {/* 8. 100% Offline Shield */}
          <button
            onClick={onOpenPrivacyCenter}
            className="floating-button p-2 rounded-full bg-white hover:bg-slate-100 border-2 border-black text-black cursor-pointer shadow-xs"
            title="100% Offline - Zero RTL leaves this machine"
          >
            <ShieldCheck className="w-4 h-4 text-black" />
          </button>

        </div>
      </div>
    </div>
  );
};
