/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * HEXA-R Natural Language to RTL Generator Modal
 * Whitish-black styling with bold black typography, floating modal animation,
 * and spec-to-SystemVerilog synthesis.
 */

import React, { useState } from 'react';
import { 
  Sparkles, 
  X, 
  Check, 
  Copy, 
  Loader2, 
  PlusCircle
} from 'lucide-react';
import { CopilotService } from '../../services/aiEngine/copilotService';
import { AIMessage } from '../../types';

interface GenerateRtlModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertRtl: (moduleName: string, code: string) => void;
  onVerifyAfterInsert: () => void;
}

const TEMPLATE_PROMPTS = [
  'Create a parameterized 32-bit synchronous FIFO with full and empty flags.',
  'Create a 32-bit ALU with zero, carry, overflow, and negative status flags.',
  'Create an 8-input Round-Robin Arbiter with grant valid and mask registers.',
  'Create an SPI Master controller with configurable CPOL and CPHA modes.',
];

export const GenerateRtlModal: React.FC<GenerateRtlModalProps> = ({
  isOpen,
  onClose,
  onInsertRtl,
  onVerifyAfterInsert,
}) => {
  const [prompt, setPrompt] = useState(TEMPLATE_PROMPTS[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<AIMessage['generatedRtl'] | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    try {
      const res = CopilotService.handleRtlGeneration(prompt);
      await new Promise(r => setTimeout(r, 600)); // Emulate NPU processing
      if (res.generatedRtl) {
        setGeneratedResult(res.generatedRtl);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (generatedResult) {
      navigator.clipboard.writeText(generatedResult.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="bg-white border-2 border-black rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden text-black font-mono text-xs animate-modal-float">
        
        {/* Header (Crisp White with Bold Black Text) */}
        <div className="h-14 px-5 bg-white border-b-2 border-black flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="p-2 rounded-xl bg-black text-white">
              <Sparkles className="w-5 h-5 text-white" />
            </span>
            <div>
              <h3 className="font-black text-sm text-black uppercase tracking-tight">Natural Language → Synthesizable RTL</h3>
              <p className="text-[11px] text-black font-bold">Spec-to-SystemVerilog synthesis accelerated by Qualcomm Hexagon NPU</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-black hover:bg-slate-100 rounded-lg border-2 border-black cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-white">
          
          {/* Prompt Input */}
          <div>
            <label className="block text-black font-black mb-1.5 text-xs uppercase tracking-wider">
              Natural Language RTL Specification:
            </label>
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              rows={3}
              placeholder="Describe your hardware module (e.g. Create a parameterized 32-bit synchronous FIFO)..."
              className="w-full bg-slate-50 border-2 border-black rounded-xl p-3 text-xs text-black font-black placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-black transition-all resize-none"
            />
          </div>

          {/* Quick Preset Specifications */}
          <div>
            <label className="block text-black font-black mb-1.5 text-[11px] uppercase tracking-wider">
              Quick Benchmark Specs:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {TEMPLATE_PROMPTS.map((t, idx) => (
                <button
                  key={idx}
                  onClick={() => setPrompt(t)}
                  className={`text-left p-2.5 rounded-xl border-2 transition-all cursor-pointer font-black text-xs ${
                    prompt === t
                      ? 'border-black bg-black text-white shadow-xs'
                      : 'border-slate-300 bg-white hover:bg-slate-100 text-black'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Generate Action Button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="w-full py-3 rounded-xl bg-black hover:bg-slate-800 disabled:opacity-50 text-white font-black text-xs transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer tracking-wider uppercase"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Snapdragon Hexagon NPU Synthesizing SystemVerilog...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-white" />
                <span>Synthesize SystemVerilog Module on NPU</span>
              </>
            )}
          </button>

          {/* Generated Result Container */}
          {generatedResult && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="font-black text-xs text-black uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse"></span>
                  SYNTHESIZED MODULE: {generatedResult.moduleName}.sv
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleCopy}
                    className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-black border-2 border-black transition-colors flex items-center gap-1 text-xs font-black cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy Code'}</span>
                  </button>
                  <button
                    onClick={() => {
                      onInsertRtl(generatedResult.moduleName, generatedResult.code);
                      onClose();
                      onVerifyAfterInsert();
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-black hover:bg-slate-800 text-white font-black transition-colors flex items-center gap-1.5 text-xs shadow-xs cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Insert & Verify</span>
                  </button>
                </div>
              </div>

              {/* Module Parameters & Ports Summary */}
              {generatedResult.interfaceDescription && (
                <div className="p-3 bg-slate-50 rounded-xl border-2 border-black text-xs text-black font-bold">
                  <span className="font-black text-black uppercase tracking-wider mr-1 text-[10px]">
                    INTERFACES:
                  </span>
                  {generatedResult.interfaceDescription}
                </div>
              )}

              {/* Code preview block with bold black text */}
              <div className="relative border-2 border-black rounded-xl overflow-hidden bg-slate-50 shadow-inner">
                <pre className="p-4 text-black font-mono text-xs font-black overflow-x-auto max-h-72 leading-relaxed">
                  {generatedResult.code}
                </pre>
              </div>
            </div>
          )}

        </div>

        {/* Footer info (Crisp White with Bold Black Text) */}
        <div className="h-12 px-5 bg-white border-t-2 border-black flex items-center justify-between text-xs text-black font-bold">
          <span className="font-black">Qualcomm Hexagon INT8 Engine • Zero RTL Uploaded • 100% Private</span>
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
