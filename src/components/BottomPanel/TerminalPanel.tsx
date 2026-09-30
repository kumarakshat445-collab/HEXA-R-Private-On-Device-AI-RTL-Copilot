/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * HEXA-R Interactive Terminal & Compiler Console
 * Whitish-black high-contrast styling with bold black output for simulation and compiler logs.
 */

import React, { useState } from 'react';
import { Terminal, Trash2, Copy, Check } from 'lucide-react';

interface TerminalPanelProps {
  logs: string;
  exitCode?: number;
  durationMs?: number;
  onClear: () => void;
}

export const TerminalPanel: React.FC<TerminalPanelProps> = ({
  logs,
  exitCode,
  durationMs,
  onClear,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(logs);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = logs ? logs.split('\n') : [];

  return (
    <div className="flex-1 flex flex-col h-full bg-white font-mono text-xs overflow-hidden select-text">
      {/* Sub-header Bar (Crisp White with Bold Black Text) */}
      <div className="h-9 px-4 bg-white border-b-2 border-black flex items-center justify-between text-black select-none">
        <div className="flex items-center space-x-3">
          <span className="flex items-center gap-1.5 text-black font-black text-xs uppercase tracking-wide">
            <Terminal className="w-4 h-4 text-black" /> RTL Execution Console
          </span>
          {exitCode !== undefined && (
            <span
              className={`text-[11px] font-black px-2.5 py-0.5 rounded-full border-2 ${
                exitCode === 0
                  ? 'bg-emerald-100 text-emerald-950 border-emerald-800'
                  : 'bg-rose-100 text-rose-950 border-rose-800'
              }`}
            >
              EXIT: {exitCode} {exitCode === 0 ? '(SUCCESS)' : '(FAILED)'}
            </span>
          )}
          {durationMs !== undefined && (
            <span className="text-[11px] text-black font-black bg-slate-100 px-2 py-0.5 rounded-md border-2 border-black">
              Duration: {durationMs}ms
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleCopy}
            className="p-1.5 hover:bg-black hover:text-white text-black border-2 border-black rounded-lg flex items-center gap-1 text-xs font-black cursor-pointer transition-all"
            title="Copy logs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={onClear}
            className="p-1.5 hover:bg-black hover:text-white text-black border-2 border-black rounded-lg cursor-pointer transition-all"
            title="Clear console"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Log Output Area with bold black typography on white background */}
      <div className="flex-1 overflow-auto p-4 space-y-1 bg-white text-black font-bold">
        {lines.length === 0 ? (
          <div className="text-slate-500 italic font-black">No simulator console output. Click &quot;VERIFY RTL&quot; to run.</div>
        ) : (
          lines.map((line, idx) => {
            const isError = line.includes('[FAIL]') || line.includes('%Error') || line.includes('FAILED');
            const isPass = line.includes('[PASS]') || line.includes('PASSED');
            const isInfo = line.includes('[HEXA-R') || line.includes('[TB]');
            const isAssertion = line.includes('Assertion');

            return (
              <div
                key={idx}
                className={`leading-relaxed whitespace-pre-wrap font-mono text-xs ${
                  isError
                    ? 'text-rose-950 font-black bg-rose-100 border-l-4 border-rose-600 px-2 py-0.5 rounded'
                    : isPass
                    ? 'text-emerald-950 font-black bg-emerald-100 border-l-4 border-emerald-600 px-2 py-0.5 rounded'
                    : isAssertion
                    ? 'text-amber-950 font-black bg-amber-100 border-l-4 border-amber-600 px-2 py-0.5 rounded'
                    : isInfo
                    ? 'text-black font-black bg-slate-100 px-2 py-0.5 rounded border border-slate-300'
                    : 'text-black font-bold'
                }`}
              >
                {line}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
