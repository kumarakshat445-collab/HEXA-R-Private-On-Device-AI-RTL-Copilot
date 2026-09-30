/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * HEXA-R Dedicated Privacy Center
 * Whitish-black styling with bold black typography, floating cards,
 * and zero-cloud-upload assurance for proprietary RTL IP.
 */

import React from 'react';
import { 
  ShieldCheck, 
  X, 
  Lock, 
  Cpu, 
  HardDrive, 
  Terminal, 
  EyeOff
} from 'lucide-react';
import { UserPreferences } from '../../types';

interface PrivacyCenterModalProps {
  isOpen: boolean;
  preferences: UserPreferences;
  onUpdatePreferences: (partial: Partial<UserPreferences>) => void;
  onClose: () => void;
}

export const PrivacyCenterModal: React.FC<PrivacyCenterModalProps> = ({
  isOpen,
  preferences,
  onUpdatePreferences,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="bg-white border-2 border-black rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden text-black font-mono text-xs animate-modal-float">
        
        {/* Header (Crisp White with Bold Black Text) */}
        <div className="h-14 px-5 bg-white border-b-2 border-black flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="p-2 rounded-xl bg-black text-white">
              <ShieldCheck className="w-5 h-5 text-white" />
            </span>
            <div>
              <h3 className="font-black text-sm text-black uppercase tracking-tight">HARDWARE IP PRIVACY CENTER</h3>
              <p className="text-[11px] text-emerald-800 font-black">100% On-Device Execution • Offline Protected</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-black hover:bg-slate-100 rounded-lg border-2 border-black cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-white">
          
          {/* Main Privacy Guarantee Banner */}
          <div className="p-4 rounded-xl bg-emerald-50 border-2 border-emerald-800 text-emerald-950 space-y-2">
            <div className="flex items-center space-x-2 font-black text-sm uppercase tracking-wide">
              <Lock className="w-4 h-4 text-emerald-800" />
              <span>ZERO PROPRIETARY RTL DATA LEAVES THIS MACHINE</span>
            </div>
            <p className="text-xs font-bold leading-relaxed">
              Unlike cloud-hosted AI copilot tools that upload your Verilog HDL and architecture design to external LLM servers, 
              <strong> HEXA-R executes all token generation, syntax evaluation, and waveform inspection entirely within your local Snapdragon PC.</strong>
            </p>
          </div>

          {/* Privacy Pillars (Floating Cards with Bold Black Typography) */}
          <div className="space-y-3">
            <div className="floating-card p-3.5 rounded-xl bg-white border-2 border-black flex items-start space-x-3">
              <div className="p-2 rounded-lg bg-slate-100 text-black border border-black flex-shrink-0 mt-0.5">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-black text-xs text-black uppercase tracking-wider">
                  On-Device Hexagon NPU Inference
                </h4>
                <p className="text-xs text-black font-bold mt-0.5">
                  AI models (Llama 3 8B INT8) are compiled and executed locally using Qualcomm QNN. No remote API requests.
                </p>
              </div>
            </div>

            <div className="floating-card p-3.5 rounded-xl bg-white border-2 border-black flex items-start space-x-3">
              <div className="p-2 rounded-lg bg-slate-100 text-black border border-black flex-shrink-0 mt-0.5">
                <HardDrive className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-black text-xs text-black uppercase tracking-wider">
                  Air-Gapped & Offline Operable
                </h4>
                <p className="text-xs text-black font-bold mt-0.5">
                  HEXA-R functions completely without an active internet connection. Designed for defense, automotive, and secure semiconductor labs.
                </p>
              </div>
            </div>

            <div className="floating-card p-3.5 rounded-xl bg-white border-2 border-black flex items-start space-x-3">
              <div className="p-2 rounded-lg bg-slate-100 text-black border border-black flex-shrink-0 mt-0.5">
                <Terminal className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-black text-xs text-black uppercase tracking-wider">
                  Local Simulation & Trace Storage
                </h4>
                <p className="text-xs text-black font-bold mt-0.5">
                  VCD waveforms, compiler logs, and testbench traces remain stored in local workspace memory.
                </p>
              </div>
            </div>

            <div className="floating-card p-3.5 rounded-xl bg-white border-2 border-black flex items-start space-x-3">
              <div className="p-2 rounded-lg bg-slate-100 text-black border border-black flex-shrink-0 mt-0.5">
                <EyeOff className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-black text-xs text-black uppercase tracking-wider">
                  Telemetry Disabled by Default
                </h4>
                <p className="text-xs text-black font-bold mt-0.5">
                  No telemetry, telemetry pings, or anonymous usage statistics are ever transmitted.
                </p>
              </div>
            </div>
          </div>

          {/* Privacy Toggles */}
          <div className="p-4 rounded-xl bg-slate-50 border-2 border-black space-y-3">
            <h4 className="font-black text-xs text-black uppercase tracking-wide">WORKSPACE SECURITY POLICIES</h4>
            
            <div className="flex items-center justify-between">
              <div>
                <span className="font-black text-xs text-black block">Strict Offline-First Mode</span>
                <span className="text-[11px] text-black font-bold">Prevent any background network connections</span>
              </div>
              <input
                type="checkbox"
                checked={preferences.offlineOnly}
                onChange={e => onUpdatePreferences({ offlineOnly: e.target.checked })}
                className="w-4 h-4 accent-black cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="font-black text-xs text-black block">Block Cloud LLM Fallback</span>
                <span className="text-[11px] text-black font-bold">Disallow cloud model queries under all conditions</span>
              </div>
              <input
                type="checkbox"
                checked={!preferences.allowCloudFallback}
                onChange={e => onUpdatePreferences({ allowCloudFallback: !e.target.checked })}
                className="w-4 h-4 accent-black cursor-pointer"
              />
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="h-12 px-5 bg-white border-t-2 border-black flex items-center justify-between text-xs text-black font-bold">
          <span className="font-black">Qualcomm Hexagon Security Sandbox</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-black text-white font-black hover:bg-slate-800 cursor-pointer shadow-xs"
          >
            Acknowledge & Close
          </button>
        </div>

      </div>
    </div>
  );
};
