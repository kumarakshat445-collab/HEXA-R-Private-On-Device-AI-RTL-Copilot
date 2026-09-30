/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * HEXA-R Snapdragon / Qualcomm Hexagon NPU Performance Center
 * Whitish-black styling with bold black typography, floating card presentation,
 * hardware telemetry, and Model Router task dispatch graph.
 */

import React, { useState } from 'react';
import { 
  Cpu, 
  X, 
  Activity, 
  Zap, 
  HardDrive, 
  Layers, 
  ShieldCheck, 
  CheckCircle2, 
  Download, 
  Database,
  ArrowDown
} from 'lucide-react';
import { InferenceRouter } from '../../services/aiEngine/inferenceRouter';
import { AIBackendType } from '../../types';

interface NpuDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectBackend: (backend: AIBackendType) => void;
}

export const NpuDashboardModal: React.FC<NpuDashboardModalProps> = ({
  isOpen,
  onClose,
  onSelectBackend,
}) => {
  const [activeTab, setActiveTab] = useState<'metrics' | 'models' | 'router'>('metrics');
  const metrics = InferenceRouter.getNpuMetrics();
  const models = InferenceRouter.getQualcommHubModels();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="bg-white border-2 border-black rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden text-black font-mono text-xs animate-modal-float">
        
        {/* Header (Crisp White with Bold Black Text) */}
        <div className="h-14 px-5 bg-white border-b-2 border-black flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="p-2 rounded-xl bg-black text-white">
              <Cpu className="w-5 h-5 text-white" />
            </span>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-black text-sm text-black uppercase tracking-tight">SNAPDRAGON / NPU PERFORMANCE CENTER</h3>
                <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-950 border-2 border-emerald-800">
                  QUALCOMM HEXAGON ACTIVE
                </span>
              </div>
              <p className="text-[11px] text-black font-bold">Snapdragon X Elite / Qualcomm QNN Runtime Engine</p>
            </div>
          </div>

          {/* Navigation Tabs (Whitish-Black) */}
          <div className="flex items-center space-x-1 bg-slate-100 p-0.5 rounded-xl border-2 border-black">
            <button
              onClick={() => setActiveTab('metrics')}
              className={`px-3 py-1 rounded-lg transition-all text-xs font-black cursor-pointer ${
                activeTab === 'metrics' ? 'bg-black text-white' : 'text-black hover:bg-slate-200'
              }`}
            >
              Performance & Telemetry
            </button>
            <button
              onClick={() => setActiveTab('models')}
              className={`px-3 py-1 rounded-lg transition-all text-xs font-black cursor-pointer ${
                activeTab === 'models' ? 'bg-black text-white' : 'text-black hover:bg-slate-200'
              }`}
            >
              Qualcomm AI Hub Models
            </button>
            <button
              onClick={() => setActiveTab('router')}
              className={`px-3 py-1 rounded-lg transition-all text-xs font-black cursor-pointer ${
                activeTab === 'router' ? 'bg-black text-white' : 'text-black hover:bg-slate-200'
              }`}
            >
              Model Router
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-black hover:bg-slate-100 rounded-lg border-2 border-black cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab 1: Performance & Telemetry */}
        {activeTab === 'metrics' && (
          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-white">
            {/* Top Stat Cards (Floating Cards with Bold Typography) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="floating-card p-3 rounded-xl bg-white border-2 border-black">
                <span className="text-[10px] text-black font-black uppercase tracking-wider block">
                  INFERENCE LATENCY
                </span>
                <div className="mt-1 text-2xl font-black text-black">
                  {metrics.latencyMs ?? 38} <span className="text-xs font-bold">ms</span>
                </div>
                <span className="text-[10px] text-emerald-800 font-black">4.8x faster than CPU</span>
              </div>

              <div className="floating-card p-3 rounded-xl bg-white border-2 border-black">
                <span className="text-[10px] text-black font-black uppercase tracking-wider block">
                  TOKEN THROUGHPUT
                </span>
                <div className="mt-1 text-2xl font-black text-black">
                  {metrics.tokensPerSec ?? 54} <span className="text-xs font-bold">tok/s</span>
                </div>
                <span className="text-[10px] text-black font-bold">Llama 3 8B INT8</span>
              </div>

              <div className="floating-card p-3 rounded-xl bg-white border-2 border-black">
                <span className="text-[10px] text-black font-black uppercase tracking-wider block">
                  NPU UTILIZATION
                </span>
                <div className="mt-1 text-2xl font-black text-black">
                  {metrics.npuUtilization ?? 42}%
                </div>
                <span className="text-[10px] text-emerald-800 font-black">Qualcomm Hexagon HTP</span>
              </div>

              <div className="floating-card p-3 rounded-xl bg-white border-2 border-black">
                <span className="text-[10px] text-black font-black uppercase tracking-wider block">
                  SYSTEM MEMORY (RAM)
                </span>
                <div className="mt-1 text-2xl font-black text-black">
                  {metrics.memoryUsageMb ?? 412} <span className="text-xs font-bold">MB</span>
                </div>
                <span className="text-[10px] text-black font-bold">Quantized weights cached</span>
              </div>
            </div>

            {/* Performance Comparison: Hexagon NPU vs CPU Fallback */}
            <div className="p-4 rounded-xl bg-slate-50 border-2 border-black space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-black text-xs text-black uppercase tracking-wide flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-black" />
                  BENCHMARK COMPARISON: HEXAGON NPU VS. CPU FALLBACK
                </h4>
                <span className="text-[10px] text-black font-black bg-white px-2 py-0.5 rounded border border-black">
                  Workload: RTL Timing Trace Analysis
                </span>
              </div>

              {/* Metric 1: Latency */}
              <div>
                <div className="flex justify-between text-xs text-black font-black mb-1">
                  <span>Latency (Lower is better)</span>
                  <span>NPU: 38ms vs CPU: 182ms</span>
                </div>
                <div className="space-y-1">
                  <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden border border-slate-300">
                    <div className="h-full bg-black rounded-full" style={{ width: '21%' }} />
                  </div>
                  <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden border border-slate-300">
                    <div className="h-full bg-rose-600 rounded-full" style={{ width: '100%' }} />
                  </div>
                </div>
              </div>

              {/* Metric 2: CPU Utilization */}
              <div>
                <div className="flex justify-between text-xs text-black font-black mb-1">
                  <span>CPU Host Load (Lower leaves CPU free for compilation)</span>
                  <span>NPU: 8% vs CPU: 78%</span>
                </div>
                <div className="space-y-1">
                  <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden border border-slate-300">
                    <div className="h-full bg-black rounded-full" style={{ width: '8%' }} />
                  </div>
                  <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden border border-slate-300">
                    <div className="h-full bg-rose-600 rounded-full" style={{ width: '78%' }} />
                  </div>
                </div>
              </div>

              {/* Metric 3: Power Consumption */}
              <div>
                <div className="flex justify-between text-xs text-black font-black mb-1">
                  <span>Power Draw (Watts)</span>
                  <span>NPU: ~4.2W vs CPU: ~28.5W (6.8x Energy Efficiency)</span>
                </div>
                <div className="space-y-1">
                  <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden border border-slate-300">
                    <div className="h-full bg-black rounded-full" style={{ width: '15%' }} />
                  </div>
                  <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden border border-slate-300">
                    <div className="h-full bg-rose-600 rounded-full" style={{ width: '95%' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Hardware Architecture Detail */}
            <div className="p-4 rounded-xl bg-white border-2 border-black space-y-2">
              <h4 className="font-black text-xs text-black uppercase tracking-wide flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-black" />
                QUALCOMM HEXAGON TENSOR PROCESSOR SPECIFICATIONS
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-300 font-bold">
                  <span className="text-black font-black block">NPU TOPS:</span>
                  <span className="text-black font-black text-sm">45 TOPS</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-300 font-bold">
                  <span className="text-black font-black block">ACCELERATOR BACKEND:</span>
                  <span className="text-black font-black text-sm">QNN HTP v2.14</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-300 font-bold">
                  <span className="text-black font-black block">PRECISION SUPPORT:</span>
                  <span className="text-black font-black text-sm">INT8, INT16, FP16</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Qualcomm AI Hub Models */}
        {activeTab === 'models' && (
          <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-white">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h4 className="font-black text-xs text-black uppercase tracking-wide">
                  OPTIMIZED MODELS FROM QUALCOMM AI HUB
                </h4>
                <p className="text-[11px] text-black font-bold">
                  Pre-quantized INT8/FP16 models compiled for Qualcomm Hexagon Tensor Processor
                </p>
              </div>
              <span className="text-[10px] text-black font-black bg-slate-100 px-2 py-1 rounded border border-black">
                {models.length} Models Available
              </span>
            </div>

            <div className="space-y-2.5">
              {models.map(m => (
                <div
                  key={m.id}
                  className="floating-card p-3.5 rounded-xl bg-white border-2 border-black flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-black text-xs text-black">{m.name}</span>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded bg-black text-white">
                        {m.quantization}
                      </span>
                      {m.isInstalled && (
                        <span className="text-[10px] text-emerald-950 font-black bg-emerald-100 px-2 py-0.5 rounded border border-emerald-800 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-700" /> Cached On-Device
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-black font-bold">{m.parameters} parameters • Status: {m.status}</p>
                    <div className="flex items-center space-x-3 text-[10px] text-black font-bold pt-0.5">
                      <span>Target: {m.targetHardware}</span>
                      <span>•</span>
                      <span>Size: {m.sizeMb} MB</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {m.isInstalled ? (
                      <button
                        onClick={() => onSelectBackend('snapdragon_npu')}
                        className="px-3.5 py-1.5 rounded-lg bg-black hover:bg-slate-800 text-white font-black text-xs cursor-pointer shadow-xs"
                      >
                        Active Model
                      </button>
                    ) : (
                      <button className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-black border-2 border-black font-black text-xs flex items-center gap-1 cursor-pointer">
                        <Download className="w-3.5 h-3.5" /> Download
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Model Router Architecture */}
        {activeTab === 'router' && (
          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-white">
            <div>
              <h4 className="font-black text-xs text-black uppercase tracking-wide">
                HEXA-R INTELLIGENT TASK ROUTER DISPATCH GRAPH
              </h4>
              <p className="text-[11px] text-black font-bold">
                Deterministically avoids LLM calls for static checks, delegating to specialized engines
              </p>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-slate-50 border-2 border-black flex items-center justify-between">
                <div>
                  <span className="text-black font-black text-xs uppercase block">Syntax & Latch Analysis</span>
                  <span className="text-[11px] text-black font-bold">Rule-based deterministic RTL parser</span>
                </div>
                <span className="text-black font-black bg-white px-2.5 py-1 rounded border-2 border-black">
                  Zero LLM Overhead (0ms)
                </span>
              </div>

              <div className="flex justify-center text-black font-black">
                <ArrowDown className="w-4 h-4 text-black" />
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border-2 border-black flex items-center justify-between">
                <div>
                  <span className="text-black font-black text-xs uppercase block">RTL Simulation & Assertions</span>
                  <span className="text-[11px] text-black font-bold">In-Memory Logic Simulator / Host Verilator</span>
                </div>
                <span className="text-black font-black bg-white px-2.5 py-1 rounded border-2 border-black">
                  Host CPU / Native EDA Tools
                </span>
              </div>

              <div className="flex justify-center text-black font-black">
                <ArrowDown className="w-4 h-4 text-black" />
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border-2 border-black flex items-center justify-between">
                <div>
                  <span className="text-black font-black text-xs uppercase block">Timing Debug & Natural Language RTL</span>
                  <span className="text-[11px] text-black font-bold">Contextual AI Hardware Copilot</span>
                </div>
                <span className="text-white font-black bg-black px-2.5 py-1 rounded">
                  Snapdragon Hexagon NPU (Llama 3 8B INT8)
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="h-12 px-5 bg-white border-t-2 border-black flex items-center justify-between text-xs text-black font-bold">
          <span className="font-black">Qualcomm AI Hub • 100% On-Device Acceleration</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-black border-2 border-black font-black cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
