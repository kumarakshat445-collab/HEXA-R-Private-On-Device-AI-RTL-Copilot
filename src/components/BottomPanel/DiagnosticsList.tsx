/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * HEXA-R Static Analyzer Diagnostics List
 * Whitish-black high-contrast styling with bold black text,
 * floating card elevation, and 1-click Auto-Fix.
 */

import React, { useState } from 'react';
import { RTLDiagnostic } from '../../types';
import { 
  AlertTriangle, 
  AlertCircle, 
  Wand2, 
  HelpCircle, 
  CheckCircle2, 
  Filter, 
  FileCode
} from 'lucide-react';

interface DiagnosticsListProps {
  diagnostics: RTLDiagnostic[];
  onSelectDiagnostic: (d: RTLDiagnostic) => void;
  onApplyFix: (d: RTLDiagnostic) => void;
  onAskAi: (d: RTLDiagnostic) => void;
}

export const DiagnosticsList: React.FC<DiagnosticsListProps> = ({
  diagnostics,
  onSelectDiagnostic,
  onApplyFix,
  onAskAi,
}) => {
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'error' | 'warning'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const filtered = diagnostics.filter(d => {
    if (filterSeverity !== 'all' && d.severity !== filterSeverity) return false;
    if (filterCategory !== 'all' && d.category !== filterCategory) return false;
    return true;
  });

  const errorCount = diagnostics.filter(d => d.severity === 'error').length;
  const warningCount = diagnostics.filter(d => d.severity === 'warning').length;

  return (
    <div className="flex-1 flex flex-col h-full bg-white font-mono text-xs overflow-hidden select-none">
      {/* Sub-header Filter Bar (Crisp White with Bold Black Text) */}
      <div className="h-9 px-4 bg-white border-b-2 border-black flex items-center justify-between text-black">
        <div className="flex items-center space-x-3">
          <span className="flex items-center gap-1.5 text-black font-black text-xs uppercase tracking-wide">
            <Filter className="w-4 h-4 text-black" /> RTL Diagnostics ({diagnostics.length})
          </span>
          <div className="flex items-center space-x-1.5 text-xs font-black">
            <button
              onClick={() => setFilterSeverity('all')}
              className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                filterSeverity === 'all'
                  ? 'bg-black text-white font-black'
                  : 'bg-white hover:bg-slate-100 text-black border border-black'
              }`}
            >
              All ({diagnostics.length})
            </button>
            <button
              onClick={() => setFilterSeverity('error')}
              className={`px-3 py-1 rounded-full flex items-center gap-1 transition-all cursor-pointer ${
                filterSeverity === 'error'
                  ? 'bg-rose-600 text-white font-black'
                  : 'bg-white hover:bg-rose-50 text-rose-700 border border-rose-600'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5" /> Errors ({errorCount})
            </button>
            <button
              onClick={() => setFilterSeverity('warning')}
              className={`px-3 py-1 rounded-full flex items-center gap-1 transition-all cursor-pointer ${
                filterSeverity === 'warning'
                  ? 'bg-amber-500 text-black font-black'
                  : 'bg-white hover:bg-amber-50 text-amber-800 border border-amber-500'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" /> Warnings ({warningCount})
            </button>
          </div>
        </div>

        {/* Category selector */}
        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          className="bg-white border-2 border-black text-black font-black text-xs rounded-lg px-2.5 py-1 focus:outline-none cursor-pointer"
        >
          <option value="all">ALL CATEGORIES</option>
          <option value="synthesizability">Synthesizability</option>
          <option value="latch_inference">Latch Inference</option>
          <option value="blocking_assignment_misuse">Blocking Misuse</option>
          <option value="syntax">Syntax</option>
          <option value="code_quality">Code Quality</option>
        </select>
      </div>

      {/* Diagnostics Cards Container with Floating Card Hover System */}
      <div className="flex-1 overflow-auto p-4 space-y-3 bg-[#f8fafc]">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-44 text-black">
            <CheckCircle2 className="w-10 h-10 mb-2 text-emerald-600" />
            <p className="font-black text-sm">NO DIAGNOSTICS DETECTED</p>
            <p className="text-black font-bold text-xs mt-1">Active RTL file passed all static checks clean</p>
          </div>
        ) : (
          filtered.map(d => {
            const isError = d.severity === 'error';
            return (
              <div
                key={d.id}
                onClick={() => onSelectDiagnostic(d)}
                className="floating-card p-4 rounded-xl bg-white border-2 border-black transition-all duration-200 cursor-pointer group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${
                        isError
                          ? 'bg-rose-100 text-rose-950 border-rose-600'
                          : 'bg-amber-100 text-amber-950 border-amber-600'
                      }`}
                    >
                      {d.severity}
                    </span>
                    <span className="text-[11px] font-mono text-black font-black flex items-center gap-1">
                      <FileCode className="w-3.5 h-3.5 text-black" />
                      {d.filePath}:{d.line}
                    </span>
                    <span className="text-[10px] text-black font-black bg-slate-100 px-2 py-0.5 rounded border border-slate-300 uppercase">
                      {d.category.replace(/_/g, ' ')}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        onAskAi(d);
                      }}
                      className="px-2.5 py-1 text-xs font-black rounded-lg bg-white hover:bg-slate-100 text-black border-2 border-black transition-all flex items-center gap-1 cursor-pointer"
                      title="Ask HEXA-R Copilot about this issue"
                    >
                      <HelpCircle className="w-3.5 h-3.5 text-black" />
                      <span>Ask Copilot</span>
                    </button>

                    {d.autoFixAvailable && (
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          onApplyFix(d);
                        }}
                        className="px-3 py-1 text-xs font-black rounded-lg bg-black hover:bg-slate-800 text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                        title="Auto-apply rule-based or AI correction"
                      >
                        <Wand2 className="w-3.5 h-3.5 text-white" />
                        <span>Auto-Fix</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Problem Headline in Bold Words */}
                <h4 className="mt-2 text-sm font-black text-black group-hover:underline">
                  {d.problem}
                </h4>

                {/* Why it matters */}
                <p className="mt-1 text-xs text-black font-bold leading-relaxed">
                  <span className="font-black underline mr-1">Why it matters:</span>
                  {d.whyItMatters}
                </p>

                {/* Suggested Fix */}
                {d.suggestedFix && (
                  <div className="mt-2.5 p-2.5 bg-slate-50 rounded-lg border-2 border-slate-300 font-mono text-xs text-black font-black">
                    <span className="text-black font-black mr-2 uppercase text-[10px] bg-white px-1.5 py-0.5 rounded border border-black">
                      Fix:
                    </span>
                    {d.suggestedFix}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
