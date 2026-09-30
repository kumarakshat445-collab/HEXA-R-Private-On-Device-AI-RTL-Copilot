/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * HEXA-R Waveform Viewer
 * Whitish-black digital waveform inspector with bold typography,
 * interactive VCD traces, and direct visual highlighting of SVA assertion failures.
 */

import React, { useState, useRef, useMemo, useEffect } from 'react';
import { WaveformTrace, AssertionResult } from '../../types';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Search, 
  Eye, 
  EyeOff, 
  Clock, 
  Layers,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Wand2,
  HelpCircle,
  ShieldAlert,
  ShieldCheck,
  Filter
} from 'lucide-react';

interface WaveformViewerProps {
  waveform: WaveformTrace | null;
  failedAtTime?: number;
  assertions?: AssertionResult[];
  onAskAi?: (question: string) => void;
  onOpenDiffModal?: () => void;
}

export const WaveformViewer: React.FC<WaveformViewerProps> = ({ 
  waveform, 
  failedAtTime,
  assertions = [],
  onAskAi,
  onOpenDiffModal,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [cursorTime, setCursorTime] = useState<number | null>(failedAtTime ?? 360);
  const [searchQuery, setSearchQuery] = useState('');
  const [hiddenSignals, setHiddenSignals] = useState<Set<string>>(new Set());
  const [showSvaOverlay, setShowSvaOverlay] = useState<boolean>(true);
  const [showSvaTrack, setShowSvaTrack] = useState<boolean>(true);
  const [isolateSvaSignals, setIsolateSvaSignals] = useState<boolean>(false);
  const [selectedAssertionId, setSelectedAssertionId] = useState<string | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter assertion lists
  const failedAssertions = useMemo(() => {
    return assertions.filter(a => a.status === 'failed');
  }, [assertions]);

  const passedAssertions = useMemo(() => {
    return assertions.filter(a => a.status === 'passed');
  }, [assertions]);

  // Unique failure timestamps
  const failureTimestamps = useMemo(() => {
    const times = new Set<number>();
    if (failedAtTime !== undefined) times.add(failedAtTime);
    failedAssertions.forEach(a => {
      if (a.timestamp !== undefined) times.add(a.timestamp);
    });
    return Array.from(times).sort((a, b) => a - b);
  }, [failedAssertions, failedAtTime]);

  // Selected assertion object
  const activeAssertion = useMemo(() => {
    if (selectedAssertionId) {
      return assertions.find(a => a.id === selectedAssertionId) || null;
    }
    if (failedAssertions.length > 0) {
      return failedAssertions[0];
    }
    return assertions[0] || null;
  }, [selectedAssertionId, assertions, failedAssertions]);

  // Auto-select first failing assertion if cursor is near it
  useEffect(() => {
    if (failedAssertions.length > 0 && !selectedAssertionId) {
      setSelectedAssertionId(failedAssertions[0].id);
    }
  }, [failedAssertions, selectedAssertionId]);

  if (!waveform || waveform.signals.length === 0) {
    return (
      <div className="flex-1 h-full flex flex-col items-center justify-center bg-white text-black font-mono text-xs">
        <Clock className="w-8 h-8 mb-2 text-slate-400" />
        <p className="font-black text-sm">NO WAVEFORM DATA AVAILABLE</p>
        <p className="text-black font-bold text-[11px] mt-1">Run simulation to generate VCD signal traces</p>
      </div>
    );
  }

  // Filter signals based on search and SVA isolation mode
  const filteredSignals = waveform.signals.filter(s => {
    if (searchQuery && !s.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (isolateSvaSignals) {
      // Signals intimately involved in UART framing and receiver logic
      const isCritical = ['clk', 'rst_n', 'framing_err', 'rx', 'rx_valid', 'rx_data', 'state'].some(keyword => 
        s.name.toLowerCase().includes(keyword)
      );
      if (!isCritical) return false;
    }
    return true;
  });

  const totalTime = waveform.endTime - waveform.startTime;
  const timeStepWidth = 32 * zoomLevel; // Width per 20ns step
  const totalWidth = Math.max(850, (totalTime / 20) * timeStepWidth);

  // Time grid markers
  const timeMarkers = useMemo(() => {
    const markers: number[] = [];
    for (let t = waveform.startTime; t <= waveform.endTime; t += 40) {
      markers.push(t);
    }
    return markers;
  }, [waveform.startTime, waveform.endTime]);

  // Jump to specific timestamp
  const jumpToTime = (t: number) => {
    setCursorTime(t);
    if (containerRef.current) {
      const leftPos = (t / totalTime) * totalWidth;
      containerRef.current.scrollTo({
        left: Math.max(0, leftPos - 250),
        behavior: 'smooth',
      });
    }
  };

  // Jump between SVA failure timestamps
  const handleNextFailure = () => {
    if (failureTimestamps.length === 0) return;
    const current = cursorTime ?? 0;
    const next = failureTimestamps.find(t => t > current) ?? failureTimestamps[0];
    jumpToTime(next);
    const relatedAsrt = failedAssertions.find(a => a.timestamp === next);
    if (relatedAsrt) setSelectedAssertionId(relatedAsrt.id);
  };

  const handlePrevFailure = () => {
    if (failureTimestamps.length === 0) return;
    const current = cursorTime ?? 0;
    const prevList = failureTimestamps.filter(t => t < current);
    const prev = prevList.length > 0 ? prevList[prevList.length - 1] : failureTimestamps[failureTimestamps.length - 1];
    jumpToTime(prev);
    const relatedAsrt = failedAssertions.find(a => a.timestamp === prev);
    if (relatedAsrt) setSelectedAssertionId(relatedAsrt.id);
  };

  // Click on waveform timeline to place cursor
  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / totalWidth));
    const calculatedTime = Math.round((ratio * totalTime) / 10) * 10;
    setCursorTime(calculatedTime);

    // If near any assertion timestamp, highlight that assertion
    const nearAssertion = assertions.find(a => a.timestamp !== undefined && Math.abs(a.timestamp - calculatedTime) <= 20);
    if (nearAssertion) {
      setSelectedAssertionId(nearAssertion.id);
    }
  };

  const toggleSignal = (name: string) => {
    setHiddenSignals(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white text-black select-none overflow-hidden font-mono text-xs">
      
      {/* 1. Waveform Controls & SVA Navigation Toolbar */}
      <div className="h-10 px-3 bg-white border-b-2 border-black flex items-center justify-between text-xs select-none">
        
        {/* Left: Trace & Assertion Status */}
        <div className="flex items-center space-x-2 overflow-x-auto py-1">
          <span className="flex items-center gap-1.5 text-black font-black uppercase tracking-wider text-xs whitespace-nowrap">
            <Layers className="w-4 h-4 text-black" /> VCD TRACE
          </span>

          <span className="text-[11px] text-black font-black bg-slate-100 px-2 py-0.5 rounded border border-black whitespace-nowrap">
            {waveform.timeUnit}
          </span>

          {/* SVA Violation Status Pill */}
          {failedAssertions.length > 0 ? (
            <div className="flex items-center space-x-1">
              <span className="text-xs text-rose-950 font-black bg-rose-200 px-2.5 py-0.5 rounded-full border-2 border-rose-600 flex items-center gap-1.5 shadow-xs whitespace-nowrap animate-pulse">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-700" />
                <span>{failedAssertions.length} SVA {failedAssertions.length === 1 ? 'VIOLATION' : 'VIOLATIONS'}</span>
              </span>

              {/* Jump Buttons */}
              <button
                onClick={handlePrevFailure}
                className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-black border border-black text-[11px] font-black cursor-pointer flex items-center gap-0.5"
                title="Jump to Previous SVA Failure"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Prev
              </button>
              <button
                onClick={handleNextFailure}
                className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-black border border-black text-[11px] font-black cursor-pointer flex items-center gap-0.5"
                title="Jump to Next SVA Failure"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <span className="text-xs text-emerald-950 font-black bg-emerald-100 px-2.5 py-0.5 rounded-full border-2 border-emerald-800 flex items-center gap-1.5 shadow-xs whitespace-nowrap">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              <span>SVA ASSERTIONS CLEAN</span>
            </span>
          )}

          {/* Active Cursor Timestamp */}
          {cursorTime !== null && (
            <span className="text-xs text-black font-black bg-amber-200 px-2 py-0.5 rounded-full border-2 border-black flex items-center gap-1.5 shadow-xs whitespace-nowrap">
              <span className="w-2 h-2 rounded-full bg-black animate-pulse"></span>
              t = {cursorTime} {waveform.timeUnit}
            </span>
          )}
        </div>

        {/* Right: SVA Display Toggles, Signal Search, Zoom */}
        <div className="flex items-center space-x-2 flex-shrink-0">
          
          {/* Toggle SVA Highlighting Overlay */}
          <button
            onClick={() => setShowSvaOverlay(prev => !prev)}
            className={`px-2.5 py-1 rounded-lg border-2 border-black text-xs font-black flex items-center gap-1 cursor-pointer transition-all shadow-xs ${
              showSvaOverlay ? 'bg-black text-white' : 'bg-white hover:bg-slate-100 text-black'
            }`}
            title="Toggle visual vertical red highlighting of SVA assertion failure zones"
          >
            <AlertTriangle className={`w-3.5 h-3.5 ${showSvaOverlay ? 'text-amber-400' : 'text-black'}`} />
            <span className="hidden sm:inline">Highlight SVA</span>
          </button>

          {/* Toggle SVA Invariants Track */}
          <button
            onClick={() => setShowSvaTrack(prev => !prev)}
            className={`px-2.5 py-1 rounded-lg border-2 border-black text-xs font-black flex items-center gap-1 cursor-pointer transition-all shadow-xs ${
              showSvaTrack ? 'bg-black text-white' : 'bg-white hover:bg-slate-100 text-black'
            }`}
            title="Toggle SVA Assertions timeline channel row"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span className="hidden md:inline">SVA Track</span>
          </button>

          {/* Isolate Critical SVA Signals */}
          <button
            onClick={() => setIsolateSvaSignals(prev => !prev)}
            className={`px-2.5 py-1 rounded-lg border-2 border-black text-xs font-black flex items-center gap-1 cursor-pointer transition-all shadow-xs ${
              isolateSvaSignals ? 'bg-amber-300 text-black' : 'bg-white hover:bg-slate-100 text-black'
            }`}
            title="Isolate signals tied directly to the failing SVA property"
          >
            <Filter className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Isolate SVA Signals</span>
          </button>

          {/* Signal Search */}
          <div className="relative hidden xl:block">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-black" />
            <input
              type="text"
              placeholder="Search signals..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-white border-2 border-black text-black font-black text-xs rounded-lg pl-7 pr-2 py-0.5 w-32 focus:outline-none focus:ring-1 focus:ring-black placeholder-slate-400"
            />
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center bg-white rounded-lg border-2 border-black p-0.5 shadow-xs">
            <button
              onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.25))}
              className="p-1 hover:bg-slate-100 rounded text-black font-black cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-1.5 text-xs font-black text-black">{Math.round(zoomLevel * 100)}%</span>
            <button
              onClick={() => setZoomLevel(prev => Math.min(3, prev + 0.25))}
              className="p-1 hover:bg-slate-100 rounded text-black font-black cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoomLevel(1)}
              className="p-1 hover:bg-slate-100 rounded text-black font-black cursor-pointer"
              title="Reset Zoom"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>

        </div>
      </div>

      {/* 2. Interactive SVA Assertion Violation Inspector Banner */}
      {activeAssertion && (
        <div className={`px-4 py-2 border-b-2 flex flex-col md:flex-row md:items-center justify-between gap-2 transition-all ${
          activeAssertion.status === 'failed' 
            ? 'bg-rose-50 border-rose-600 text-rose-950' 
            : 'bg-emerald-50 border-emerald-800 text-emerald-950'
        }`}>
          <div className="flex items-start md:items-center space-x-3">
            {activeAssertion.status === 'failed' ? (
              <span className="p-1.5 rounded-lg bg-rose-600 text-white font-black flex items-center justify-center flex-shrink-0 animate-pulse">
                <AlertTriangle className="w-4 h-4" />
              </span>
            ) : (
              <span className="p-1.5 rounded-lg bg-emerald-700 text-white font-black flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </span>
            )}
            
            <div className="space-y-0.5">
              <div className="flex items-center space-x-2 flex-wrap">
                <span className="font-black text-xs uppercase tracking-tight">
                  {activeAssertion.name}
                </span>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                  activeAssertion.status === 'failed' 
                    ? 'bg-rose-200 text-rose-950 border-rose-700' 
                    : 'bg-emerald-200 text-emerald-950 border-emerald-800'
                }`}>
                  {activeAssertion.status === 'failed' ? 'SVA ASSERTION VIOLATION' : 'VERIFIED INVARIANT'}
                </span>
                {activeAssertion.timestamp !== undefined && (
                  <span className="text-[10px] font-black bg-white px-2 py-0.5 rounded border border-black text-black">
                    t = {activeAssertion.timestamp}ns
                  </span>
                )}
                <span className="text-[10px] font-bold text-slate-600">
                  {activeAssertion.file}:{activeAssertion.line}
                </span>
              </div>

              <div className="flex items-center space-x-2 text-[11px] font-bold">
                <span className="bg-white/80 px-1.5 py-0.5 rounded border border-black/30 text-black font-black">
                  Expression: {activeAssertion.expression}
                </span>
                {activeAssertion.failureMessage && (
                  <span className="text-rose-900 font-bold hidden lg:inline">
                    • {activeAssertion.failureMessage}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick SVA Actions */}
          <div className="flex items-center space-x-2 flex-shrink-0">
            {activeAssertion.timestamp !== undefined && (
              <button
                onClick={() => jumpToTime(activeAssertion.timestamp!)}
                className="px-2.5 py-1 rounded-md bg-white hover:bg-slate-100 text-black border-2 border-black text-xs font-black cursor-pointer shadow-xs transition-colors flex items-center gap-1"
                title="Align waveform cursor to this assertion timestamp"
              >
                <Clock className="w-3.5 h-3.5" /> Jump to {activeAssertion.timestamp}ns
              </button>
            )}

            {onAskAi && (
              <button
                onClick={() => onAskAi(`Explain why the SVA assertion "${activeAssertion.name}" (${activeAssertion.expression}) failed at t=${activeAssertion.timestamp}ns. Detail the RTL timing violation and propose fix.`)}
                className="px-2.5 py-1 rounded-md bg-white hover:bg-slate-100 text-black border-2 border-black text-xs font-black cursor-pointer shadow-xs transition-colors flex items-center gap-1"
                title="Ask HEXA-R Copilot to diagnose this formal assertion violation"
              >
                <HelpCircle className="w-3.5 h-3.5 text-black" />
                <span>Ask AI</span>
              </button>
            )}

            {activeAssertion.status === 'failed' && onOpenDiffModal && (
              <button
                onClick={onOpenDiffModal}
                className="px-3 py-1 rounded-md bg-black hover:bg-slate-800 text-white text-xs font-black cursor-pointer shadow-xs transition-colors flex items-center gap-1.5"
                title="Open diff viewer and auto-apply timing correction"
              >
                <Wand2 className="w-3.5 h-3.5 text-white" />
                <span>Auto-Fix</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* 3. Main Split Viewport: Left Signal Tree, Right Timeline & Waveform Graphics */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left: Signal Labels, Properties, and SVA Invariants Channel */}
        <div className="w-64 bg-white border-r-2 border-black flex flex-col flex-shrink-0 z-10 shadow-xs">
          <div className="h-8 px-3 bg-slate-100 border-b-2 border-black text-[10px] text-black font-black flex items-center justify-between uppercase tracking-wider">
            <span>SIGNAL / SVA CHANNEL</span>
            <span>VAL @ CURSOR</span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y-2 divide-slate-100">
            
            {/* Dedicated SVA Formal Invariants Track Header */}
            {showSvaTrack && (
              <div 
                className={`h-10 px-3 flex items-center justify-between text-xs font-black transition-colors border-b-2 border-black ${
                  failedAssertions.length > 0 
                    ? 'bg-rose-100 text-rose-950 font-black' 
                    : 'bg-emerald-50 text-emerald-950 font-black'
                }`}
              >
                <div className="flex items-center space-x-1.5 truncate">
                  {failedAssertions.length > 0 ? (
                    <ShieldAlert className="w-4 h-4 text-rose-700 flex-shrink-0 animate-pulse" />
                  ) : (
                    <ShieldCheck className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                  )}
                  <span className="truncate uppercase tracking-tight text-[11px]">
                    SVA INVARIANTS ({assertions.length})
                  </span>
                </div>

                <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${
                  failedAssertions.length > 0 
                    ? 'bg-rose-600 text-white border-rose-800' 
                    : 'bg-emerald-200 text-emerald-950 border-emerald-800'
                }`}>
                  {failedAssertions.length > 0 ? `${failedAssertions.length} FAIL` : 'PASS'}
                </span>
              </div>
            )}

            {/* Signal Rows */}
            {filteredSignals.map(sig => {
              const isHidden = hiddenSignals.has(sig.name);
              let curVal = sig.values[0]?.value;
              for (const v of sig.values) {
                if (v.time <= (cursorTime ?? 0)) curVal = v.value;
                else break;
              }

              const isErrorSig = sig.name.includes('framing_err') || sig.name.includes('err');

              return (
                <div
                  key={sig.name}
                  className={`h-9 px-3 flex items-center justify-between text-xs font-black transition-colors ${
                    isErrorSig && curVal === 1 
                      ? 'bg-rose-100 text-rose-950 font-black' 
                      : 'hover:bg-slate-50 text-black'
                  }`}
                >
                  <div className="flex items-center space-x-1.5 truncate max-w-[150px]">
                    <button
                      onClick={() => toggleSignal(sig.name)}
                      className="text-black hover:text-slate-600 cursor-pointer"
                    >
                      {isHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-black" />}
                    </button>
                    <span className="truncate font-black tracking-tight" title={sig.name}>
                      {sig.name}
                    </span>
                  </div>

                  <span
                    className={`text-xs font-black px-2 py-0.5 rounded border ${
                      sig.width > 1
                        ? 'text-black bg-amber-200 border-black'
                        : curVal === 1
                        ? 'text-black bg-emerald-200 border-black'
                        : 'text-black bg-slate-100 border-slate-300'
                    }`}
                  >
                    {curVal}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Waveform Graphics & Timeline with Visual SVA Highlighting */}
        <div ref={containerRef} className="flex-1 overflow-x-auto overflow-y-auto relative bg-white">
          <div style={{ width: `${totalWidth}px` }} className="min-w-full">
            
            {/* 3.1 Timeline Header Ruler */}
            <div
              onClick={handleTimelineClick}
              className="h-8 bg-slate-100 border-b-2 border-black sticky top-0 z-20 cursor-crosshair relative flex items-center text-xs text-black font-black select-none shadow-xs"
            >
              {timeMarkers.map(t => {
                const leftPos = (t / totalTime) * totalWidth;
                return (
                  <div
                    key={t}
                    style={{ left: `${leftPos}px` }}
                    className="absolute flex flex-col items-center -translate-x-1/2"
                  >
                    <span>{t}ns</span>
                    <span className="w-0.5 h-1.5 bg-black mt-0.5"></span>
                  </div>
                );
              })}
            </div>

            {/* 3.2 SVA Timeline Track (Events & Assertion Diamonds along time axis) */}
            {showSvaTrack && (
              <div 
                className="h-10 bg-slate-50 border-b-2 border-black relative cursor-pointer select-none"
                onClick={handleTimelineClick}
              >
                {/* Horizontal reference baseline */}
                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-300" />

                {/* SVA Assertion Points on Timeline */}
                {assertions.map(asrt => {
                  if (asrt.timestamp === undefined) return null;
                  const leftPos = (asrt.timestamp / totalTime) * totalWidth;
                  const isFail = asrt.status === 'failed';
                  const isSelected = selectedAssertionId === asrt.id;

                  return (
                    <div
                      key={asrt.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedAssertionId(asrt.id);
                        jumpToTime(asrt.timestamp!);
                      }}
                      style={{ left: `${leftPos}px` }}
                      className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-25 transition-transform cursor-pointer group ${
                        isSelected ? 'scale-125' : 'hover:scale-115'
                      }`}
                      title={`[${asrt.status.toUpperCase()}] ${asrt.name} at t=${asrt.timestamp}ns\n${asrt.expression}`}
                    >
                      {isFail ? (
                        <div className="flex items-center space-x-1 bg-rose-600 text-white px-2 py-0.5 rounded-full border-2 border-black shadow-md animate-pulse">
                          <AlertTriangle className="w-3.5 h-3.5 fill-amber-300 text-black" />
                          <span className="text-[10px] font-black uppercase tracking-tight whitespace-nowrap">
                            FAIL {asrt.timestamp}ns
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1 bg-emerald-700 text-white px-1.5 py-0.5 rounded-full border border-black shadow-xs">
                          <CheckCircle2 className="w-3 h-3 text-white" />
                          <span className="text-[9px] font-black">{asrt.timestamp}ns</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* 3.3 Signal Waveform Rows & Failure Zone Overlays */}
            <div className="relative divide-y-2 divide-slate-100" onClick={handleTimelineClick}>
              
              {/* SVA ASSERTION FAILURE HIGHLIGHTING OVERLAY (Vertical tinted stripes across all signals) */}
              {showSvaOverlay && failureTimestamps.map(t => {
                const centerPos = (t / totalTime) * totalWidth;
                const windowWidth = Math.max(36, (40 / totalTime) * totalWidth); // 40ns inspection window
                const leftPos = Math.max(0, centerPos - (windowWidth / 2));
                const matchingAssertion = failedAssertions.find(a => a.timestamp === t);

                return (
                  <div
                    key={`sva_highlight_${t}`}
                    style={{
                      left: `${leftPos}px`,
                      width: `${windowWidth}px`,
                    }}
                    className="absolute top-0 bottom-0 z-15 pointer-events-none border-l-2 border-r-2 border-dashed border-rose-600 bg-rose-500/15"
                  >
                    {/* Floating top badge directly on the failure window */}
                    <div className="sticky top-0 left-0 right-0 bg-rose-600 text-white font-mono text-[9px] font-black px-1.5 py-0.5 text-center shadow-md flex items-center justify-center gap-1">
                      <AlertTriangle className="w-2.5 h-2.5 fill-white text-rose-600" />
                      <span>SVA FAIL @ {t}ns</span>
                    </div>

                    {/* Watermark in failure zone */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-10">
                      <span className="font-black text-4xl text-rose-700 rotate-90 select-none">
                        VIOLATION
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Cursor Vertical Tracking Indicator Line */}
              {cursorTime !== null && (
                <div
                  style={{ left: `${(cursorTime / totalTime) * totalWidth}px` }}
                  className="absolute top-0 bottom-0 w-0.5 bg-black z-30 pointer-events-none"
                >
                  <div className="sticky top-0 bg-black text-white font-mono text-[9px] font-black px-1.5 py-0.5 rounded -translate-x-1/2 shadow-md">
                    {cursorTime}ns
                  </div>
                </div>
              )}

              {/* Waveform Trace Lines for each Signal */}
              {filteredSignals.map(sig => {
                if (hiddenSignals.has(sig.name)) return null;

                const isBus = sig.width > 1;
                const isErrorSig = sig.name.includes('framing_err') || sig.name.includes('err');

                return (
                  <div 
                    key={sig.name} 
                    className={`h-9 relative cursor-crosshair ${
                      isErrorSig ? 'bg-rose-50/40' : ''
                    }`}
                  >
                    <svg className="w-full h-full" style={{ width: `${totalWidth}px` }}>
                      {/* Grid vertical faint lines */}
                      {timeMarkers.map(t => (
                        <line
                          key={t}
                          x1={(t / totalTime) * totalWidth}
                          y1={0}
                          x2={(t / totalTime) * totalWidth}
                          y2={36}
                          stroke="#e2e8f0"
                          strokeWidth="1"
                          strokeDasharray="2 4"
                        />
                      ))}

                      {/* Render Single-Bit Digital Waveform in Bold Black (or Red for Errors) */}
                      {!isBus && (
                        <polyline
                          fill="none"
                          stroke={isErrorSig ? '#dc2626' : '#000000'}
                          strokeWidth={isErrorSig ? '2.5' : '2'}
                          points={sig.values
                            .map((v, i) => {
                              const x = (v.time / totalTime) * totalWidth;
                              const y = v.value === 1 ? 8 : 28;
                              const prev = sig.values[i - 1];
                              if (prev && prev.value !== v.value) {
                                const prevY = prev.value === 1 ? 8 : 28;
                                return `${x},${prevY} ${x},${y}`;
                              }
                              return `${x},${y}`;
                            })
                            .join(' ')}
                        />
                      )}

                      {/* Render Multi-Bit Bus Waveform with Hex Labels in Bold Black */}
                      {isBus && (
                        <g>
                          {sig.values.map((v, i) => {
                            const next = sig.values[i + 1];
                            const x1 = (v.time / totalTime) * totalWidth;
                            const x2 = next ? (next.time / totalTime) * totalWidth : totalWidth;
                            const width = x2 - x1;
                            const isErrVal = String(v.value).includes('ERR') || String(v.value).includes('XX');

                            return (
                              <g key={i}>
                                {/* Bus boundary polygon */}
                                <polygon
                                  points={`
                                    ${x1 + 3},8 
                                    ${x2 - 3},8 
                                    ${x2},18 
                                    ${x2 - 3},28 
                                    ${x1 + 3},28 
                                    ${x1},18
                                  `}
                                  fill={isErrVal ? '#fee2e2' : '#f1f5f9'}
                                  stroke={isErrVal ? '#dc2626' : '#000000'}
                                  strokeWidth="1.5"
                                />
                                {width > 40 && (
                                  <text
                                    x={x1 + width / 2}
                                    y={22}
                                    textAnchor="middle"
                                    fill={isErrVal ? '#991b1b' : '#000000'}
                                    fontSize="10"
                                    fontFamily="monospace"
                                    fontWeight="bold"
                                  >
                                    {v.value}
                                  </text>
                                )}
                              </g>
                            );
                          })}
                        </g>
                      )}
                    </svg>
                  </div>
                );
              })}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
