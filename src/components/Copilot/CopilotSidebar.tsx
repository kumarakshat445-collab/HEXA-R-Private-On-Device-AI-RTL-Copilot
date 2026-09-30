/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * HEXA-R Gemini Hardware Copilot & Debugging Console
 * Full workspace command execution driven by Gemini API (gemini-3.8-flash)
 * with on-device Snapdragon NPU acceleration.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  AIMessage,
  AIBackendType,
  RTLFile,
  SimulationResult,
  RTLDiagnostic,
  AICommandAction,
} from '../../types';
import { 
  Sparkles, 
  Send, 
  FileCode, 
  Copy, 
  Check, 
  Wand2, 
  ArrowRight,
  PlusCircle,
  Play,
  Activity,
  Layers,
  Terminal,
  Zap,
  RotateCcw,
  CheckCircle2,
  Bot
} from 'lucide-react';

interface CopilotSidebarProps {
  messages: AIMessage[];
  isThinking: boolean;
  activeFile: RTLFile | null;
  activeBackend: AIBackendType;
  simulationResult: SimulationResult | null;
  diagnostics: RTLDiagnostic[];
  onSendMessage: (text: string) => void;
  onOpenDiffModal: (fix: NonNullable<AIMessage['proposedFix']>) => void;
  onInsertGeneratedRtl: (rtl: NonNullable<AIMessage['generatedRtl']>) => void;
  onOpenNpuDashboard: () => void;
  onExecuteAction?: (action: AICommandAction) => void;
}

const QUICK_COMMANDS = [
  'Fix the UART timing bug',
  'Run full verification',
  'Show waveform at 360ns',
  'Create 8-bit counter',
  'Explain state machine',
  'Generate SVA assertions',
];

export const CopilotSidebar: React.FC<CopilotSidebarProps> = ({
  messages,
  isThinking,
  activeFile,
  activeBackend,
  simulationResult,
  diagnostics,
  onSendMessage,
  onOpenDiffModal,
  onInsertGeneratedRtl,
  onOpenNpuDashboard,
  onExecuteAction,
}) => {
  const [inputText, setInputText] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [executedActions, setExecutedActions] = useState<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isThinking) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleActionClick = (action: AICommandAction, actionKey: string) => {
    if (onExecuteAction) {
      onExecuteAction(action);
      setExecutedActions(prev => new Set(prev).add(actionKey));
    }
  };

  return (
    <aside className="w-88 sm:w-96 bg-white border-l-2 border-black flex flex-col h-full text-xs select-none z-10 shadow-xs font-mono">
      
      {/* Header with Gemini API & Model Status */}
      <div className="h-12 px-4 border-b-2 border-black flex items-center justify-between bg-white">
        <div className="flex items-center space-x-2">
          <div className="p-1 rounded bg-black text-white">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-black text-black text-xs uppercase tracking-tight block">
              GEMINI COPILOT
            </span>
            <span className="text-[10px] text-slate-600 font-bold block">
              Natural Language RTL Commands
            </span>
          </div>
        </div>

        {/* Gemini Active Badge */}
        <button
          onClick={onOpenNpuDashboard}
          className="floating-button flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-50 hover:bg-slate-100 border-2 border-black text-xs text-black font-black transition-colors cursor-pointer shadow-xs"
          title="Powered by Gemini 3.8 Flash via @google/genai SDK"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse"></span>
          <span className="font-black text-[11px]">Gemini 3.8 Flash</span>
        </button>
      </div>

      {/* Context Bar */}
      {activeFile && (
        <div className="px-4 py-2 bg-slate-50 border-b-2 border-black flex items-center justify-between text-xs text-black font-black">
          <div className="flex items-center space-x-2 truncate">
            <FileCode className="w-4 h-4 text-black flex-shrink-0" />
            <span className="truncate text-black font-black">{activeFile.name}</span>
          </div>
          {simulationResult && !simulationResult.success ? (
            <span className="text-rose-950 font-black bg-rose-200 px-2 py-0.5 rounded border border-rose-600 text-[10px]">
              SIMULATION FAIL (t=360ns)
            </span>
          ) : (
            <span className="text-emerald-900 font-black bg-emerald-100 px-2 py-0.5 rounded border border-emerald-700 text-[10px]">
              CONTEXT READY
            </span>
          )}
        </div>
      )}

      {/* Messages List Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 select-text bg-[#fcfcfd]">
        {messages.map(msg => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
            >
              {/* Sender & Timestamp */}
              <div className="flex items-center space-x-1.5 mb-1 px-1 text-[11px] text-slate-600 font-black">
                <span className="text-black font-black">
                  {isUser ? 'YOU (COMMAND)' : `GEMINI (${msg.modelName || 'gemini-3.8-flash'})`}
                </span>
                <span>•</span>
                <span>{msg.timestamp}</span>
              </div>

              {/* Message Bubble */}
              <div
                className={`p-4 rounded-2xl max-w-[95%] leading-relaxed ${
                  isUser
                    ? 'bg-black text-white rounded-br-none shadow-md font-bold'
                    : 'bg-white text-black rounded-bl-none border-2 border-black shadow-md font-bold'
                }`}
              >
                {/* Text Content */}
                <div className="whitespace-pre-wrap text-xs space-y-2.5 font-bold">
                  {msg.content.split('\n\n').map((paragraph, pIdx) => {
                    if (paragraph.startsWith('```')) {
                      const cleanCode = paragraph.replace(/```[a-zA-Z]*\n?/, '').replace(/```$/, '');
                      return (
                        <div key={pIdx} className="bg-slate-100 p-3 rounded-xl border-2 border-black my-2 font-mono text-[11px] relative shadow-inner">
                          <button
                            onClick={() => copyCode(cleanCode, `${msg.id}_${pIdx}`)}
                            className="absolute top-2.5 right-2.5 text-black hover:bg-slate-200 p-1 rounded bg-white border border-slate-300 cursor-pointer"
                            title="Copy code"
                          >
                            {copiedId === `${msg.id}_${pIdx}` ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                          <pre className="overflow-x-auto text-black font-black">{cleanCode}</pre>
                        </div>
                      );
                    }
                    return <p key={pIdx} className="leading-relaxed">{paragraph}</p>;
                  })}
                </div>

                {/* Real-time Workspace Action Execution Cards */}
                {msg.actions && msg.actions.length > 0 && (
                  <div className="mt-3 pt-3 border-t-2 border-black/10 space-y-2">
                    <span className="text-[10px] uppercase font-black tracking-wider text-black flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      EXECUTED WORKSPACE ACTIONS ({msg.actions.length}):
                    </span>

                    {msg.actions.map((act, aIdx) => {
                      const actionKey = `${msg.id}_act_${aIdx}`;
                      const isExecuted = executedActions.has(actionKey);

                      if (act.type === 'modify_file') {
                        return (
                          <div key={aIdx} className="p-2.5 rounded-xl bg-amber-50 border-2 border-black text-black space-y-1.5 shadow-xs">
                            <div className="flex items-center justify-between text-[11px] font-black">
                              <span className="flex items-center gap-1.5">
                                <Wand2 className="w-3.5 h-3.5 text-black" />
                                <span>MODIFIED: {act.fileName}</span>
                              </span>
                              <span className="text-[10px] bg-amber-200 px-1.5 py-0.5 rounded border border-black">
                                RTL UPDATE
                              </span>
                            </div>
                            <p className="text-[11px] font-bold text-slate-800">{act.explanation}</p>
                            <div className="flex items-center space-x-2 pt-1">
                              <button
                                onClick={() => handleActionClick(act, actionKey)}
                                className="px-3 py-1 rounded-lg bg-black hover:bg-slate-800 text-white font-black text-xs cursor-pointer shadow-xs flex items-center gap-1"
                              >
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                <span>{isExecuted ? 'Applied' : 'Apply Code to Editor'}</span>
                              </button>
                              {msg.proposedFix && (
                                <button
                                  onClick={() => onOpenDiffModal(msg.proposedFix!)}
                                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-black border-2 border-black font-black text-xs cursor-pointer"
                                >
                                  Review Diff
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      }

                      if (act.type === 'create_file') {
                        return (
                          <div key={aIdx} className="p-2.5 rounded-xl bg-slate-50 border-2 border-black text-black space-y-1.5 shadow-xs">
                            <div className="flex items-center justify-between text-[11px] font-black">
                              <span className="flex items-center gap-1.5">
                                <PlusCircle className="w-3.5 h-3.5 text-black" />
                                <span>CREATED: {act.fileName}</span>
                              </span>
                              <span className="text-[10px] bg-slate-200 px-1.5 py-0.5 rounded border border-black">
                                NEW MODULE
                              </span>
                            </div>
                            <p className="text-[11px] font-bold text-slate-800">{act.explanation || act.path}</p>
                            <button
                              onClick={() => handleActionClick(act, actionKey)}
                              className="px-3 py-1 rounded-lg bg-black hover:bg-slate-800 text-white font-black text-xs cursor-pointer shadow-xs flex items-center gap-1"
                            >
                              <PlusCircle className="w-3 h-3" />
                              <span>Insert Into Project</span>
                            </button>
                          </div>
                        );
                      }

                      if (act.type === 'run_verification') {
                        return (
                          <div key={aIdx} className="p-2.5 rounded-xl bg-emerald-50 border-2 border-black text-black flex items-center justify-between shadow-xs">
                            <div>
                              <span className="font-black text-xs block flex items-center gap-1">
                                <Play className="w-3.5 h-3.5 fill-black" /> VERIFICATION TRIGGERED
                              </span>
                              <span className="text-[10px] font-bold text-slate-700">{act.reason}</span>
                            </div>
                            <button
                              onClick={() => handleActionClick(act, actionKey)}
                              className="px-3 py-1 rounded-lg bg-black hover:bg-slate-800 text-white font-black text-xs cursor-pointer shadow-xs"
                            >
                              Run Again
                            </button>
                          </div>
                        );
                      }

                      if (act.type === 'navigate_ui') {
                        return (
                          <div key={aIdx} className="p-2.5 rounded-xl bg-white border-2 border-black text-black flex items-center justify-between shadow-xs">
                            <div>
                              <span className="font-black text-xs block uppercase">
                                NAVIGATED TO: {act.tab || 'WORKSPACE'} {act.waveformTime ? `@ ${act.waveformTime}ns` : ''}
                              </span>
                              <span className="text-[10px] font-bold text-slate-700">{act.reason}</span>
                            </div>
                            <button
                              onClick={() => handleActionClick(act, actionKey)}
                              className="px-3 py-1 rounded-lg bg-black hover:bg-slate-800 text-white font-black text-xs cursor-pointer shadow-xs"
                            >
                              Focus
                            </button>
                          </div>
                        );
                      }

                      return null;
                    })}
                  </div>
                )}

                {/* Legacy Proposed Code Fix Card (if no actions array) */}
                {msg.proposedFix && (!msg.actions || msg.actions.length === 0) && (
                  <div className="mt-3 p-3 bg-amber-50 rounded-xl border-2 border-black text-black font-mono shadow-md">
                    <div className="flex items-center justify-between text-xs text-black font-black mb-1.5 uppercase tracking-wide">
                      <span className="flex items-center gap-1.5">
                        <Wand2 className="w-4 h-4 text-black" /> PROPOSED TIMING CORRECTION ({msg.proposedFix.fileName})
                      </span>
                    </div>
                    <p className="text-xs text-black font-bold mb-2.5 leading-normal">{msg.proposedFix.explanation}</p>
                    <button
                      onClick={() => onOpenDiffModal(msg.proposedFix!)}
                      className="w-full py-2 rounded-lg bg-black hover:bg-slate-800 text-white font-black text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer uppercase tracking-wider"
                    >
                      <span>REVIEW CODE DIFF & APPLY FIX</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Legacy Generated RTL Card */}
                {msg.generatedRtl && (!msg.actions || msg.actions.length === 0) && (
                  <div className="mt-3 p-3 bg-slate-50 rounded-xl border-2 border-black text-black font-mono shadow-md">
                    <div className="flex items-center justify-between text-xs text-black font-black mb-1.5 uppercase tracking-wide">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-black" /> SYNTHESIZED: {msg.generatedRtl.moduleName}.sv
                      </span>
                    </div>
                    <button
                      onClick={() => onInsertGeneratedRtl(msg.generatedRtl!)}
                      className="w-full py-2 rounded-lg bg-black hover:bg-slate-800 text-white font-black text-xs flex items-center justify-center gap-1.5 transition-all mt-1.5 shadow-sm cursor-pointer uppercase tracking-wider"
                    >
                      <PlusCircle className="w-4 h-4" /> INSERT INTO PROJECT
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Thinking Indicator */}
        {isThinking && (
          <div className="flex items-center space-x-2 text-black text-xs py-2 px-1 font-black">
            <span className="w-3 h-3 rounded-full bg-black animate-pulse"></span>
            <span className="font-mono uppercase tracking-wide">
              Gemini reasoning & preparing workspace commands...
            </span>
          </div>
        )}

        <div ref={scrollRef} />
      </div>

      {/* Quick Command Chips */}
      <div className="p-2.5 border-t-2 border-black bg-white">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {QUICK_COMMANDS.map((cmd, idx) => (
            <button
              key={idx}
              onClick={() => onSendMessage(cmd)}
              className="floating-tab whitespace-nowrap px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-black border-2 border-black text-xs font-black font-mono flex-shrink-0 cursor-pointer shadow-xs"
            >
              {cmd}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Command Input Form */}
      <form onSubmit={handleSubmit} className="p-3 bg-slate-50 border-t-2 border-black">
        <div className="relative flex items-center">
          <input
            type="text"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            placeholder="Command Gemini (e.g. 'Fix the UART timing bug', 'Verify RTL')..."
            disabled={isThinking}
            className="w-full bg-white border-2 border-black rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-black font-black placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-black transition-colors font-mono"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isThinking}
            className="absolute right-1.5 p-2 rounded-lg bg-black hover:bg-slate-800 disabled:opacity-40 text-white transition-colors cursor-pointer"
            title="Execute Command"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>

    </aside>
  );
};
