/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * HEXA-R GitHub-style Diff Viewer Modal
 * Whitish-black styling with bold black typography, high-contrast diff lines,
 * and smooth floating modal entrance.
 */

import React, { useState } from 'react';
import { 
  Check, 
  X, 
  Sparkles, 
  FileCode, 
  Columns, 
  AlignJustify
} from 'lucide-react';

interface DiffViewerModalProps {
  isOpen: boolean;
  fileName: string;
  originalCode: string;
  correctedCode: string;
  explanation: string;
  onApplyFix: () => void;
  onReject: () => void;
  onAskAi: (question: string) => void;
  onExplainChange: () => void;
}

export const DiffViewerModal: React.FC<DiffViewerModalProps> = ({
  isOpen,
  fileName,
  originalCode,
  correctedCode,
  explanation,
  onApplyFix,
  onReject,
  onAskAi,
  onExplainChange,
}) => {
  const [viewMode, setViewMode] = useState<'split' | 'unified'>('split');

  if (!isOpen) return null;

  const origLines = originalCode.split('\n');
  const corrLines = correctedCode.split('\n');

  // Simple diff generator identifying changed lines
  const maxLines = Math.max(origLines.length, corrLines.length);
  const diffItems: {
    lineNum: number;
    orig: string;
    corr: string;
    isDifferent: boolean;
  }[] = [];

  for (let i = 0; i < maxLines; i++) {
    const orig = origLines[i] || '';
    const corr = corrLines[i] || '';
    diffItems.push({
      lineNum: i + 1,
      orig,
      corr,
      isDifferent: orig !== corr,
    });
  }

  const changedCount = diffItems.filter(d => d.isDifferent).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="bg-white border-2 border-black rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden text-black font-mono text-xs animate-modal-float">
        
        {/* Header (Crisp White with Bold Black Text) */}
        <div className="h-14 px-5 bg-white border-b-2 border-black flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="p-2 rounded-xl bg-black text-white">
              <Sparkles className="w-5 h-5 text-white" />
            </span>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-black text-sm text-black uppercase tracking-tight">Review AI Proposed RTL Fix</h3>
                <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-amber-200 text-black border border-black">
                  {changedCount} {changedCount === 1 ? 'line changed' : 'lines changed'}
                </span>
              </div>
              <p className="text-xs text-black font-bold flex items-center gap-1.5 mt-0.5">
                <FileCode className="w-3.5 h-3.5 text-black" /> {fileName}
              </p>
            </div>
          </div>

          {/* View Mode Toggle & Close */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border-2 border-black text-xs font-black">
              <button
                onClick={() => setViewMode('split')}
                className={`px-3 py-1 rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                  viewMode === 'split' ? 'bg-black text-white' : 'text-black hover:bg-slate-200'
                }`}
              >
                <Columns className="w-3.5 h-3.5" /> Split
              </button>
              <button
                onClick={() => setViewMode('unified')}
                className={`px-3 py-1 rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                  viewMode === 'unified' ? 'bg-black text-white' : 'text-black hover:bg-slate-200'
                }`}
              >
                <AlignJustify className="w-3.5 h-3.5" /> Unified
              </button>
            </div>

            <button
              onClick={onReject}
              className="p-1.5 text-black hover:bg-slate-100 rounded-lg border-2 border-black cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Explanation Banner in Bold Black Words */}
        <div className="px-5 py-3 bg-amber-50 border-b-2 border-black text-xs text-black font-bold flex items-start space-x-2">
          <span className="font-black uppercase tracking-wider text-black bg-amber-300 px-2 py-0.5 rounded border border-black text-[10px] mt-0.5">
            CORRECTION ANALYSIS:
          </span>
          <p className="flex-1 font-bold leading-relaxed">{explanation}</p>
        </div>

        {/* Diff Display Viewport */}
        <div className="flex-1 overflow-auto bg-white p-3 font-mono text-xs">
          {viewMode === 'split' ? (
            /* Split View */
            <div className="grid grid-cols-2 gap-3 min-w-[700px]">
              {/* Left Column: Original */}
              <div className="border-2 border-black rounded-xl overflow-hidden bg-white shadow-xs">
                <div className="h-7 px-3 bg-rose-100 border-b-2 border-black text-rose-950 font-black text-[11px] flex items-center justify-between uppercase">
                  <span>ORIGINAL (BUGGY)</span>
                  <span>- {changedCount}</span>
                </div>
                <div className="divide-y divide-slate-100 overflow-x-auto">
                  {diffItems.map(item => (
                    <div
                      key={item.lineNum}
                      className={`flex text-xs font-bold leading-5 ${
                        item.isDifferent ? 'bg-rose-100 text-rose-950 font-black' : 'text-black'
                      }`}
                    >
                      <span className="w-10 px-2 py-0.5 text-right text-slate-400 select-none bg-slate-50 border-r border-slate-200 text-[10px] font-black">
                        {item.lineNum}
                      </span>
                      <pre className="px-3 py-0.5 overflow-x-auto font-mono flex-1 whitespace-pre">
                        {item.orig || ' '}
                      </pre>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Corrected */}
              <div className="border-2 border-black rounded-xl overflow-hidden bg-white shadow-xs">
                <div className="h-7 px-3 bg-emerald-100 border-b-2 border-black text-emerald-950 font-black text-[11px] flex items-center justify-between uppercase">
                  <span>CORRECTED (HEXA-R NPU)</span>
                  <span>+ {changedCount}</span>
                </div>
                <div className="divide-y divide-slate-100 overflow-x-auto">
                  {diffItems.map(item => (
                    <div
                      key={item.lineNum}
                      className={`flex text-xs font-bold leading-5 ${
                        item.isDifferent ? 'bg-emerald-100 text-emerald-950 font-black' : 'text-black'
                      }`}
                    >
                      <span className="w-10 px-2 py-0.5 text-right text-slate-400 select-none bg-slate-50 border-r border-slate-200 text-[10px] font-black">
                        {item.lineNum}
                      </span>
                      <pre className="px-3 py-0.5 overflow-x-auto font-mono flex-1 whitespace-pre">
                        {item.corr || ' '}
                      </pre>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Unified View */
            <div className="border-2 border-black rounded-xl overflow-hidden bg-white shadow-xs min-w-[700px]">
              <div className="h-7 px-3 bg-slate-100 border-b-2 border-black text-black font-black text-[11px] flex items-center justify-between uppercase">
                <span>UNIFIED DIFF</span>
                <span>CHANGES: {changedCount}</span>
              </div>
              <div className="divide-y divide-slate-100 overflow-x-auto">
                {diffItems.map(item => {
                  if (item.isDifferent) {
                    return (
                      <React.Fragment key={item.lineNum}>
                        <div className="flex text-xs bg-rose-100 text-rose-950 font-black leading-5">
                          <span className="w-10 px-2 py-0.5 text-right text-rose-600 select-none bg-rose-200 border-r border-rose-300 text-[10px]">
                            -
                          </span>
                          <pre className="px-3 py-0.5 overflow-x-auto font-mono flex-1 whitespace-pre">
                            {item.orig}
                          </pre>
                        </div>
                        <div className="flex text-xs bg-emerald-100 text-emerald-950 font-black leading-5">
                          <span className="w-10 px-2 py-0.5 text-right text-emerald-600 select-none bg-emerald-200 border-r border-emerald-300 text-[10px]">
                            +
                          </span>
                          <pre className="px-3 py-0.5 overflow-x-auto font-mono flex-1 whitespace-pre">
                            {item.corr}
                          </pre>
                        </div>
                      </React.Fragment>
                    );
                  }
                  return (
                    <div key={item.lineNum} className="flex text-xs text-black font-bold leading-5">
                      <span className="w-10 px-2 py-0.5 text-right text-slate-400 select-none bg-slate-50 border-r border-slate-200 text-[10px] font-black">
                        {item.lineNum}
                      </span>
                      <pre className="px-3 py-0.5 overflow-x-auto font-mono flex-1 whitespace-pre">
                        {item.orig}
                      </pre>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions (Crisp White with Bold Black Text) */}
        <div className="h-16 px-5 bg-white border-t-2 border-black flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={onExplainChange}
              className="px-3.5 py-2 rounded-lg bg-white hover:bg-slate-100 text-black border-2 border-black text-xs font-black transition-colors cursor-pointer"
            >
              Explain Timing Slip
            </button>
            <button
              onClick={() => onAskAi('What would happen if sample_cnt condition is not fixed?')}
              className="px-3.5 py-2 rounded-lg bg-white hover:bg-slate-100 text-black border-2 border-black text-xs font-black transition-colors cursor-pointer"
            >
              Ask AI Impact
            </button>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={onReject}
              className="px-4 py-2 rounded-lg bg-white hover:bg-slate-100 text-black border-2 border-black text-xs font-black transition-colors cursor-pointer"
            >
              Reject Fix
            </button>
            <button
              onClick={onApplyFix}
              className="px-6 py-2 rounded-lg bg-black hover:bg-slate-800 text-white font-black text-xs transition-all flex items-center gap-2 shadow-md cursor-pointer tracking-wider"
            >
              <Check className="w-4 h-4 text-white" />
              <span>APPLY PROPOSED FIX</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
