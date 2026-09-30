/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * HEXA-R Verification Pipeline Display
 * Crisp white background with bold black typography and clean stage indicators.
 */

import React from 'react';
import { StageStatus } from '../../types';
import { 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  FileText
} from 'lucide-react';

interface VerificationPipelineProps {
  stages: StageStatus[];
  isVerifying: boolean;
  onOpenReport?: () => void;
  reportAvailable?: boolean;
}

export const VerificationPipeline: React.FC<VerificationPipelineProps> = ({
  stages,
  isVerifying,
  onOpenReport,
  reportAvailable,
}) => {
  return (
    <div className="h-9 px-4 bg-white border-t-2 border-slate-200 flex items-center justify-between text-xs select-none shadow-xs">
      <div className="flex items-center space-x-2 overflow-x-auto py-0.5 scrollbar-none">
        <span className="text-black text-xs font-black uppercase tracking-wider mr-1">
          PIPELINE:
        </span>

        {stages.map((stage, idx) => {
          let icon = <span className="w-2 h-2 rounded-full bg-slate-400" />;
          let textClass = 'text-slate-600 font-bold';

          if (stage.status === 'running') {
            icon = <Loader2 className="w-3.5 h-3.5 text-black animate-spin" />;
            textClass = 'text-black font-black bg-slate-100 px-2 py-0.5 rounded border border-black';
          } else if (stage.status === 'passed') {
            icon = <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />;
            textClass = 'text-black font-black';
          } else if (stage.status === 'failed') {
            icon = <XCircle className="w-3.5 h-3.5 text-rose-600" />;
            textClass = 'text-rose-700 font-black bg-rose-100 px-2 py-0.5 rounded border border-rose-600';
          }

          return (
            <React.Fragment key={stage.stage}>
              <div
                className={`flex items-center space-x-1.5 px-2 py-0.5 rounded text-xs font-mono transition-all ${textClass}`}
                title={stage.message || stage.label}
              >
                {icon}
                <span>{stage.label}</span>
                {stage.durationMs !== undefined && (
                  <span className="text-[10px] text-slate-500 font-sans font-bold">{stage.durationMs}ms</span>
                )}
              </div>
              {idx < stages.length - 1 && (
                <span className="text-slate-400 font-black text-xs">→</span>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Verification Report Action */}
      {reportAvailable && (
        <button
          onClick={onOpenReport}
          className="ml-2 px-3 py-1 rounded-md bg-white hover:bg-slate-100 text-black border-2 border-black transition-colors flex items-center gap-1.5 text-xs font-black font-mono cursor-pointer shadow-xs"
        >
          <FileText className="w-3.5 h-3.5 text-black" />
          <span>REPORT</span>
        </button>
      )}
    </div>
  );
};
