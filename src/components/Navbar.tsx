/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * HEXA-R Primary Navbar
 * Crisp white background with bold black typography and clean borders.
 */

import React, { useState } from 'react';
import { EngineeringMode } from '../types';
import { 
  Play, 
  Cpu, 
  Sparkles, 
  Settings, 
  FileText, 
  Loader2, 
  ChevronDown, 
  Zap, 
  PanelLeft, 
  PanelRight, 
  PanelBottom, 
  CheckCircle2, 
  Lock 
} from 'lucide-react';

interface NavbarProps {
  projectName: string;
  isVerifying: boolean;
  engineeringMode: EngineeringMode;
  isLeftSidebarOpen: boolean;
  isRightCopilotOpen: boolean;
  isBottomPanelOpen: boolean;
  onToggleLeftSidebar: () => void;
  onToggleRightCopilot: () => void;
  onToggleBottomPanel: () => void;
  onVerifyRtl: () => void;
  onGenerateRtl: () => void;
  onOpenReport: () => void;
  onOpenPrivacyCenter: () => void;
  onOpenNpuCenter: () => void;
  onOpenSettings: () => void;
  onChangeMode: (mode: EngineeringMode) => void;
  onRunDemoFlow: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  projectName,
  isVerifying,
  engineeringMode,
  isLeftSidebarOpen,
  isRightCopilotOpen,
  isBottomPanelOpen,
  onToggleLeftSidebar,
  onToggleRightCopilot,
  onToggleBottomPanel,
  onVerifyRtl,
  onGenerateRtl,
  onOpenReport,
  onOpenPrivacyCenter,
  onOpenNpuCenter,
  onOpenSettings,
  onChangeMode,
  onRunDemoFlow,
}) => {
  const [showModeDropdown, setShowModeDropdown] = useState(false);

  return (
    <header className="h-14 bg-white border-b-2 border-slate-200 flex items-center justify-between px-4 select-none z-30 shadow-xs">
      
      {/* Left: Brand & Sidebar toggle */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onToggleLeftSidebar}
          className={`p-1.5 rounded-lg border-2 transition-colors cursor-pointer ${
            isLeftSidebarOpen 
              ? 'text-white bg-black border-black shadow-xs' 
              : 'text-black bg-white hover:bg-slate-100 border-slate-300'
          }`}
          title="Toggle Project Explorer"
        >
          <PanelLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center text-white shadow-sm">
            <Cpu className="w-5 h-5 text-white" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="font-black text-base tracking-wider text-black font-mono">HEXA-R</span>
            <span className="text-xs font-black text-black bg-slate-100 px-2 py-0.5 rounded border border-slate-300 hidden sm:inline-block">
              ON-DEVICE RTL COPILOT
            </span>
          </div>
        </div>

        <div className="h-5 w-0.5 bg-slate-300 hidden md:block" />

        {/* Project Badge */}
        <div className="hidden md:flex items-center space-x-2 text-xs">
          <span className="text-slate-500 font-extrabold uppercase">PROJECT:</span>
          <span className="text-black font-black font-mono bg-slate-100 px-2.5 py-1 rounded border-2 border-slate-300">
            {projectName}
          </span>
        </div>
      </div>

      {/* Center: Main Primary Actions */}
      <div className="flex items-center space-x-2.5">
        {/* Prominent VERIFY RTL Button */}
        <button
          onClick={onVerifyRtl}
          disabled={isVerifying}
          className="floating-button px-5 py-1.5 rounded-full bg-black hover:bg-slate-800 disabled:opacity-50 text-white font-black text-xs flex items-center gap-1.5 shadow-sm cursor-pointer tracking-wider"
          title="Run parsing, static analysis, compile, simulation & AI analysis"
        >
          {isVerifying ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span className="font-black">VERIFYING...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-white" />
              <span className="font-black">VERIFY RTL</span>
            </>
          )}
        </button>

        {/* Natural Language RTL Generator */}
        <button
          onClick={onGenerateRtl}
          className="floating-button px-3.5 py-1.5 rounded-full bg-white hover:bg-slate-100 text-black border-2 border-black font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
          title="Generate Verilog/SystemVerilog from natural language specification"
        >
          <Sparkles className="w-3.5 h-3.5 text-black" />
          <span className="font-black hidden sm:inline">Generate RTL</span>
        </button>

        {/* Quick Demo Walkthrough */}
        <button
          onClick={onRunDemoFlow}
          className="floating-button px-3 py-1.5 rounded-full bg-amber-100 hover:bg-amber-200 text-black border-2 border-black font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
          title="Step-by-step hackathon demo flow"
        >
          <Zap className="w-3.5 h-3.5 text-black fill-black" />
          <span className="font-black hidden md:inline">Demo Tour</span>
        </button>
      </div>

      {/* Right: Status Pills, Panel Toggles, Settings */}
      <div className="flex items-center space-x-2.5">
        
        {/* Combined Status Badge (Snapdragon NPU + Offline) with Floating Animation */}
        <button
          onClick={onOpenNpuCenter}
          className="floating-button hidden sm:flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-50 hover:bg-slate-100 border-2 border-black text-xs font-black text-black cursor-pointer shadow-xs animate-subtle-float"
          title="Qualcomm Hexagon NPU is active locally. Click for NPU dashboard."
        >
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse"></span>
          <span className="font-black text-black">HEXAGON NPU</span>
          <span className="text-slate-400 font-bold">•</span>
          <span className="text-black font-black flex items-center gap-1">
            <Lock className="w-3.5 h-3.5 text-black" /> OFFLINE
          </span>
        </button>

        {/* Mode Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowModeDropdown(!showModeDropdown)}
            className="floating-button px-3 py-1 rounded-md bg-white hover:bg-slate-100 border-2 border-slate-300 text-xs text-black font-black capitalize flex items-center gap-1 cursor-pointer"
            title="Switch Engineering Mode"
          >
            <span className="font-black">{engineeringMode}</span>
            <ChevronDown className="w-3.5 h-3.5 text-black" />
          </button>

          {showModeDropdown && (
            <div className="absolute right-0 mt-1.5 w-36 bg-white border-2 border-black rounded-xl shadow-2xl py-1.5 z-40 text-xs font-black font-mono">
              {(['beginner', 'student', 'professional'] as EngineeringMode[]).map(m => (
                <button
                  key={m}
                  onClick={() => {
                    onChangeMode(m);
                    setShowModeDropdown(false);
                  }}
                  className={`w-full text-left px-3 py-2 capitalize transition-colors flex items-center justify-between cursor-pointer font-black ${
                    engineeringMode === m ? 'bg-black text-white' : 'text-black hover:bg-slate-100'
                  }`}
                >
                  <span className="font-black">{m}</span>
                  {engineeringMode === m && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Panel Toggles */}
        <div className="flex items-center space-x-1 pl-1 border-l-2 border-slate-200">
          <button
            onClick={onToggleBottomPanel}
            className={`p-1.5 rounded-lg border-2 transition-colors cursor-pointer ${
              isBottomPanelOpen 
                ? 'text-white bg-black border-black shadow-xs' 
                : 'text-black bg-white hover:bg-slate-100 border-slate-300'
            }`}
            title="Toggle Console & Waveform Drawer"
          >
            <PanelBottom className="w-4 h-4" />
          </button>

          <button
            onClick={onToggleRightCopilot}
            className={`p-1.5 rounded-lg border-2 transition-colors cursor-pointer ${
              isRightCopilotOpen 
                ? 'text-white bg-black border-black shadow-xs' 
                : 'text-black bg-white hover:bg-slate-100 border-slate-300'
            }`}
            title="Toggle AI Copilot Sidebar"
          >
            <PanelRight className="w-4 h-4" />
          </button>
        </div>

        {/* Verification Report */}
        <button
          onClick={onOpenReport}
          className="p-1.5 rounded-lg text-black hover:bg-slate-100 border-2 border-slate-300 transition-colors cursor-pointer"
          title="View Verification Sign-off Report"
        >
          <FileText className="w-4 h-4" />
        </button>

        {/* Settings */}
        <button
          onClick={onOpenSettings}
          className="p-1.5 rounded-lg text-black hover:bg-slate-100 border-2 border-slate-300 transition-colors cursor-pointer"
          title="Open Workbench Settings"
        >
          <Settings className="w-4 h-4" />
        </button>

      </div>
    </header>
  );
};
