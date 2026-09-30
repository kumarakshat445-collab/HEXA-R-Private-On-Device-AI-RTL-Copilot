/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * HEXA-R Settings Modal
 * Whitish-black configuration for General Editor, AI Inference Backend, Hardware/NPU,
 * Simulators (Verilator/Icarus/Yosys), and Privacy.
 */

import React, { useState } from 'react';
import { 
  Settings, 
  X, 
  Cpu, 
  Sparkles, 
  ShieldCheck, 
  Sliders, 
  Save, 
  CheckCircle2, 
  Terminal
} from 'lucide-react';
import { UserPreferences, AIBackendType, DetectedTools } from '../../types';

interface SettingsModalProps {
  isOpen: boolean;
  preferences: UserPreferences;
  detectedTools: DetectedTools;
  onUpdatePreferences: (partial: Partial<UserPreferences>) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  preferences,
  detectedTools,
  onUpdatePreferences,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'editor' | 'ai' | 'tools' | 'privacy'>('editor');
  const [localPrefs, setLocalPrefs] = useState<UserPreferences>(preferences);
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onUpdatePreferences(localPrefs);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="bg-white border-2 border-black rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden text-black font-mono text-xs animate-modal-float">
        
        {/* Header (Crisp White with Bold Black Text) */}
        <div className="h-14 px-5 bg-white border-b-2 border-black flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="p-2 rounded-xl bg-black text-white">
              <Settings className="w-5 h-5 text-white" />
            </span>
            <div>
              <h3 className="font-black text-sm text-black uppercase tracking-tight">HEXA-R WORKBENCH CONFIGURATION</h3>
              <p className="text-[11px] text-black font-bold">Preferences, Qualcomm AI Hub, and EDA Toolchain Adapters</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleSave}
              className="px-3.5 py-1.5 rounded-lg bg-black hover:bg-slate-800 text-white font-black text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              {saved ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Save className="w-3.5 h-3.5" />}
              <span>{saved ? 'Saved!' : 'Save Changes'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-black hover:bg-slate-100 rounded-lg border-2 border-black cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs (Whitish-Black) */}
        <div className="h-10 px-5 bg-slate-50 border-b-2 border-black flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('editor')}
            className={`px-3 py-1 rounded-md transition-all font-black text-xs cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'editor' ? 'bg-black text-white' : 'text-black hover:bg-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" /> Editor
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`px-3 py-1 rounded-md transition-all font-black text-xs cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'ai' ? 'bg-black text-white' : 'text-black hover:bg-slate-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" /> AI & NPU Engine
          </button>
          <button
            onClick={() => setActiveTab('tools')}
            className={`px-3 py-1 rounded-md transition-all font-black text-xs cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'tools' ? 'bg-black text-white' : 'text-black hover:bg-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" /> Host EDA Adapters
          </button>
          <button
            onClick={() => setActiveTab('privacy')}
            className={`px-3 py-1 rounded-md transition-all font-black text-xs cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'privacy' ? 'bg-black text-white' : 'text-black hover:bg-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" /> Privacy & Local IP
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-white">
          
          {/* Tab 1: Editor */}
          {activeTab === 'editor' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 border-2 border-black space-y-3">
                <h4 className="font-black text-xs text-black uppercase tracking-wide">MONACO CODE EDITOR PREFERENCES</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-black font-black mb-1">Editor Font Size (px):</label>
                    <input
                      type="number"
                      value={localPrefs.fontSize}
                      min={10}
                      max={24}
                      onChange={e => setLocalPrefs({ ...localPrefs, fontSize: parseInt(e.target.value) || 13 })}
                      className="w-full bg-white border-2 border-black rounded-lg px-3 py-1.5 text-black font-black"
                    />
                  </div>

                  <div>
                    <label className="block text-black font-black mb-1">Tab Indent Size:</label>
                    <select
                      value={localPrefs.tabSize}
                      onChange={e => setLocalPrefs({ ...localPrefs, tabSize: parseInt(e.target.value) })}
                      className="w-full bg-white border-2 border-black rounded-lg px-3 py-1.5 text-black font-black"
                    >
                      <option value={2}>2 Spaces (SystemVerilog Standard)</option>
                      <option value={4}>4 Spaces</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-black">Enable Code Minimap</span>
                    <input
                      type="checkbox"
                      checked={localPrefs.minimap}
                      onChange={e => setLocalPrefs({ ...localPrefs, minimap: e.target.checked })}
                      className="w-4 h-4 accent-black cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="font-black text-black">Word Wrap Long Lines</span>
                    <input
                      type="checkbox"
                      checked={localPrefs.wordWrap}
                      onChange={e => setLocalPrefs({ ...localPrefs, wordWrap: e.target.checked })}
                      className="w-4 h-4 accent-black cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: AI & NPU Engine */}
          {activeTab === 'ai' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 border-2 border-black space-y-3">
                <h4 className="font-black text-xs text-black uppercase tracking-wide">ACTIVE INFERENCE ENGINE & BACKEND</h4>
                
                <div>
                  <label className="block text-black font-black mb-1">Compute Backend Target:</label>
                  <select
                    value={localPrefs.aiBackend}
                    onChange={e => setLocalPrefs({ ...localPrefs, aiBackend: e.target.value as AIBackendType })}
                    className="w-full bg-white border-2 border-black rounded-lg px-3 py-2 text-black font-black"
                  >
                    <option value="snapdragon_npu">Snapdragon Hexagon NPU (Recommended - 45 TOPS INT8)</option>
                    <option value="onnx_local">ONNX Runtime DirectML / CPU</option>
                    <option value="rule_based_only">Deterministic Rule Engine Only (No LLM)</option>
                    <option value="cloud_fallback">Cloud Fallback (Requires manual opt-in)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-black font-black mb-1">Local Model Weights:</label>
                    <input
                      type="text"
                      disabled
                      value={localPrefs.selectedModel}
                      className="w-full bg-slate-100 border-2 border-slate-300 rounded-lg px-3 py-1.5 text-black font-black"
                    />
                  </div>

                  <div>
                    <label className="block text-black font-black mb-1">Temperature ({localPrefs.temperature}):</label>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={localPrefs.temperature}
                      onChange={e => setLocalPrefs({ ...localPrefs, temperature: parseFloat(e.target.value) })}
                      className="w-full accent-black cursor-pointer mt-2"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div>
                    <span className="font-black text-black block">Snapdragon Hexagon NPU Acceleration</span>
                    <span className="text-[11px] text-black font-bold">Use Qualcomm QNN HTP tensor runtime</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={localPrefs.enableNpuAcceleration}
                    onChange={e => setLocalPrefs({ ...localPrefs, enableNpuAcceleration: e.target.checked })}
                    className="w-4 h-4 accent-black cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Host EDA Adapters */}
          {activeTab === 'tools' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 border-2 border-black space-y-3">
                <h4 className="font-black text-xs text-black uppercase tracking-wide">HOST EDA COMPILERS & SIMULATORS</h4>
                <p className="text-[11px] text-black font-bold">
                  HEXA-R bridges directly to native Verilator, Icarus Verilog, and Yosys synthesis tools.
                </p>

                <div className="space-y-2">
                  <div className="p-3 bg-white rounded-lg border-2 border-black flex items-center justify-between">
                    <div>
                      <span className="font-black text-black block">In-Memory Logic Simulator</span>
                      <span className="text-[11px] text-emerald-800 font-black">ACTIVE • Cycle-Accurate Built-in</span>
                    </div>
                    <span className="text-[10px] font-black bg-emerald-100 text-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                      v2.4 Ready
                    </span>
                  </div>

                  <div className="p-3 bg-white rounded-lg border-2 border-black flex items-center justify-between">
                    <div>
                      <span className="font-black text-black block">Verilator (C++ High Speed Simulator)</span>
                      <span className="text-[11px] text-black font-bold">
                        {detectedTools.verilator.installed ? 'Detected' : 'Not installed on host'}
                      </span>
                    </div>
                    <span className="text-[10px] font-black bg-slate-100 px-2 py-0.5 rounded border border-black">
                      Adapter Ready
                    </span>
                  </div>

                  <div className="p-3 bg-white rounded-lg border-2 border-black flex items-center justify-between">
                    <div>
                      <span className="font-black text-black block">Icarus Verilog (iverilog)</span>
                      <span className="text-[11px] text-black font-bold">
                        {detectedTools.iverilog.installed ? 'Detected' : 'Not installed on host'}
                      </span>
                    </div>
                    <span className="text-[10px] font-black bg-slate-100 px-2 py-0.5 rounded border border-black">
                      Adapter Ready
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Privacy */}
          {activeTab === 'privacy' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 border-2 border-black space-y-3">
                <h4 className="font-black text-xs text-black uppercase tracking-wide">SECURITY & LOCAL RETENTION</h4>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-black text-black block">Offline Enforcement</span>
                    <span className="text-[11px] text-black font-bold">Block all external internet socket connections</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={localPrefs.offlineOnly}
                    onChange={e => setLocalPrefs({ ...localPrefs, offlineOnly: e.target.checked })}
                    className="w-4 h-4 accent-black cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-black text-black block">Zero Cloud Fallback</span>
                    <span className="text-[11px] text-black font-bold">Never allow RTL prompts to be routed off-device</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={!localPrefs.allowCloudFallback}
                    onChange={e => setLocalPrefs({ ...localPrefs, allowCloudFallback: !e.target.checked })}
                    className="w-4 h-4 accent-black cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="h-12 px-5 bg-white border-t-2 border-black flex items-center justify-between text-xs text-black font-bold">
          <span className="font-black">Qualcomm Snapdragon Engineering Environment</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-black text-white font-black hover:bg-slate-800 cursor-pointer shadow-xs"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
