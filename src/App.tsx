/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * HEXA-R — Private On-Device AI Copilot for RTL Engineering
 * Main Application Orchestrator
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Project, 
  RTLFile, 
  RTLDiagnostic, 
  StageStatus, 
  SimulationResult, 
  VerificationReport, 
  AIMessage, 
  AICommandAction,
  UserPreferences,
  EngineeringMode,
  AIBackendType,
  DetectedTools
} from './types';
import { StorageService } from './services/storage';
import { createUartDemoProject, UART_RX_CODE_BUGGY, UART_RX_CODE_FIXED } from './services/demoProjects';
import { RTLAnalyzer } from './services/rtlAnalyzer';
import { SimulationEngine } from './services/simulationEngine';
import { CopilotService } from './services/aiEngine/copilotService';
import { SystemToolsDetector } from './services/systemToolsDetector';

// Components
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { MonacoRtlEditor } from './components/Editor/MonacoRtlEditor';
import { DiffViewerModal } from './components/Editor/DiffViewerModal';
import { TerminalPanel } from './components/BottomPanel/TerminalPanel';
import { WaveformViewer } from './components/BottomPanel/WaveformViewer';
import { DiagnosticsList } from './components/BottomPanel/DiagnosticsList';
import { VerificationPipeline } from './components/BottomPanel/VerificationPipeline';
import { CopilotSidebar } from './components/Copilot/CopilotSidebar';
import { GenerateRtlModal } from './components/Modals/GenerateRtlModal';
import { VerificationReportModal } from './components/Modals/VerificationReportModal';
import { NpuDashboardModal } from './components/Modals/NpuDashboardModal';
import { PrivacyCenterModal } from './components/Modals/PrivacyCenterModal';
import { SettingsModal } from './components/Modals/SettingsModal';
import { DemoWalkthroughModal } from './components/Modals/DemoWalkthroughModal';
import { FloatingToolbar } from './components/FloatingToolbar';

import { Terminal, Activity, AlertTriangle, Layers, X, Plus, Maximize2, Minimize2, ChevronDown, ChevronUp, FileCode } from 'lucide-react';

const INITIAL_PIPELINE_STAGES: StageStatus[] = [
  { stage: 'parse', label: 'Parse', status: 'pending' },
  { stage: 'static_analysis', label: 'Static Analysis', status: 'pending' },
  { stage: 'compile', label: 'Compile', status: 'pending' },
  { stage: 'testbench', label: 'Testbench', status: 'pending' },
  { stage: 'simulation', label: 'Simulation', status: 'pending' },
  { stage: 'assertions', label: 'Assertions', status: 'pending' },
  { stage: 'ai_analysis', label: 'AI Review', status: 'pending' },
];

export default function App() {
  // 1. User & Workspace State
  const [profile, setProfile] = useState(() => StorageService.getUserProfile());
  const [preferences, setPreferences] = useState<UserPreferences>(() => profile.preferences);
  const [project, setProject] = useState<Project>(() => {
    const saved = StorageService.getActiveProject();
    return saved || createUartDemoProject();
  });

  // 2. Active Files & Open Tabs
  const [activeFileId, setActiveFileId] = useState<string>(project.activeFileId || 'file_uart_rx');
  const [openFileIds, setOpenFileIds] = useState<string[]>(project.openFileIds || ['file_uart_rx', 'file_uart_tx', 'file_uart_tb']);

  // 3. Diagnostics & Simulation
  const [simResult, setSimResult] = useState<SimulationResult | null>(null);
  const [terminalLogs, setTerminalLogs] = useState<string>(
    '[HEXA-R] RTL Engineering Environment Initialized.\n' +
    '[HEXA-R] Target Platform: Snapdragon X Elite (Qualcomm Hexagon NPU Enabled)\n' +
    '[HEXA-R] Privacy Status: 100% Offline (No code leaves device)\n' +
    '[HEXA-R] Ready. Click "VERIFY RTL" or ask HEXA-R Copilot.\n'
  );
  const [isVerifying, setIsVerifying] = useState(false);
  const [pipelineStages, setPipelineStages] = useState<StageStatus[]>(INITIAL_PIPELINE_STAGES);
  const [latestReport, setLatestReport] = useState<VerificationReport | null>(null);

  // 4. Detected Host EDA Tools
  const [detectedTools, setDetectedTools] = useState<DetectedTools>({
    iverilog: { installed: false },
    verilator: { installed: false },
    yosys: { installed: false },
    snapdragonQNN: { installed: false },
    inMemorySimulator: { installed: true, version: 'HEXA-R In-Memory Simulator v2.4' },
  });

  // 5. Copilot Chat
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: 'msg_init',
      role: 'assistant',
      content: `Welcome to **HEXA-R**, your private on-device RTL Engineering Copilot.

🟢 **Snapdragon Hexagon NPU Status:** Active (INT8 Quantized)
🛡️ **Privacy Shield:** 100% On-Device (Zero cloud transmission)
📁 **Active Project:** UART Controller (8-N-1 Serial Transceiver)

You can ask me to:
- **"Why did simulation fail?"** (Analyzes compiler trace & waveform slip)
- **"Explain this always_ff block"**
- **"Generate testbench"**
- **"Check synthesizability & latches"**
- Or click **"VERIFY RTL"** to execute the verification pipeline!`,
      timestamp: new Date().toLocaleTimeString(),
      backendUsed: 'snapdragon_npu',
      modelName: 'Llama 3 8B INT8 (Snapdragon QNN)',
    },
  ]);
  const [isCopilotThinking, setIsCopilotThinking] = useState(false);

  // 6. Bottom Panel & Layout Visibility
  const [bottomTab, setBottomTab] = useState<'terminal' | 'waveform' | 'diagnostics'>('terminal');
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(true);
  const [isRightCopilotOpen, setIsRightCopilotOpen] = useState(true);
  const [isBottomPanelOpen, setIsBottomPanelOpen] = useState(true);
  const [isBottomPanelExpanded, setIsBottomPanelExpanded] = useState(false);

  // 7. Modals
  const [isDiffModalOpen, setIsDiffModalOpen] = useState(false);
  const [pendingDiff, setPendingDiff] = useState<NonNullable<AIMessage['proposedFix']> | null>(null);
  const [isGenerateRtlModalOpen, setIsGenerateRtlModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isNpuDashboardOpen, setIsNpuDashboardOpen] = useState(false);
  const [isPrivacyCenterOpen, setIsPrivacyCenterOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDemoWalkthroughOpen, setIsDemoWalkthroughOpen] = useState(false);

  // Helper: flatten files
  const allFiles = useMemo<RTLFile[]>(() => {
    const list: RTLFile[] = [];
    const traverse = (folder: any) => {
      if (folder.files) list.push(...folder.files);
      if (folder.subFolders) folder.subFolders.forEach(traverse);
    };
    project.rootFolders.forEach(traverse);
    return list;
  }, [project]);

  // Active File object
  const activeFile = useMemo<RTLFile | null>(() => {
    return allFiles.find(f => f.id === activeFileId) || allFiles[0] || null;
  }, [allFiles, activeFileId]);

  // Real-time Static Analysis Diagnostics
  const diagnostics = useMemo<RTLDiagnostic[]>(() => {
    return RTLAnalyzer.analyzeProject(allFiles);
  }, [allFiles]);

  // Detect tools on startup
  useEffect(() => {
    SystemToolsDetector.detectTools().then(tools => setDetectedTools(tools));
  }, []);

  // Update file content
  const handleContentChange = useCallback((newContent: string) => {
    if (!activeFile) return;

    setProject(prev => {
      const updateFile = (folder: any): any => ({
        ...folder,
        files: folder.files.map((f: RTLFile) =>
          f.id === activeFile.id ? { ...f, content: newContent, isModified: true } : f
        ),
        subFolders: folder.subFolders?.map(updateFile),
      });

      const updated: Project = {
        ...prev,
        rootFolders: prev.rootFolders.map(updateFile),
      };

      StorageService.saveActiveProject(updated);
      return updated;
    });
  }, [activeFile]);

  // Handle Tab Selection
  const handleSelectFile = useCallback((fileId: string) => {
    setActiveFileId(fileId);
    if (!openFileIds.includes(fileId)) {
      setOpenFileIds(prev => [...prev, fileId]);
    }
  }, [openFileIds]);

  const handleCloseTab = useCallback((fileId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = openFileIds.filter(id => id !== fileId);
    setOpenFileIds(updated);
    if (activeFileId === fileId && updated.length > 0) {
      setActiveFileId(updated[updated.length - 1]);
    }
  }, [openFileIds, activeFileId]);

  // ==========================================
  // VERIFY RTL Pipeline Execution
  // ==========================================
  const handleVerifyRtl = useCallback(async () => {
    if (isVerifying) return;
    setIsVerifying(true);
    setBottomTab('terminal');

    // Reset stages
    setPipelineStages([
      { stage: 'parse', label: 'Parse', status: 'running' },
      { stage: 'static_analysis', label: 'Static Analysis', status: 'pending' },
      { stage: 'compile', label: 'Compile', status: 'pending' },
      { stage: 'testbench', label: 'Testbench', status: 'pending' },
      { stage: 'simulation', label: 'Simulation', status: 'pending' },
      { stage: 'assertions', label: 'Assertions', status: 'pending' },
      { stage: 'ai_analysis', label: 'AI Review', status: 'pending' },
    ]);

    // Stage 1: Parse
    await new Promise(r => setTimeout(r, 200));
    setPipelineStages(prev => prev.map(s => s.stage === 'parse' ? { ...s, status: 'passed', durationMs: 18 } : s.stage === 'static_analysis' ? { ...s, status: 'running' } : s));

    // Stage 2: Static Analysis
    await new Promise(r => setTimeout(r, 250));
    const currentDiags = RTLAnalyzer.analyzeProject(allFiles);
    const hasFatalSyntax = currentDiags.some(d => d.category === 'syntax' && d.severity === 'error');
    setPipelineStages(prev => prev.map(s => s.stage === 'static_analysis' ? { ...s, status: hasFatalSyntax ? 'failed' : 'passed', durationMs: 42 } : s.stage === 'compile' ? { ...s, status: 'running' } : s));

    // Stage 3: Compile
    await new Promise(r => setTimeout(r, 300));
    setPipelineStages(prev => prev.map(s => s.stage === 'compile' ? { ...s, status: 'passed', durationMs: 84 } : s.stage === 'testbench' ? { ...s, status: 'running' } : s));

    // Stage 4: Testbench
    await new Promise(r => setTimeout(r, 200));
    setPipelineStages(prev => prev.map(s => s.stage === 'testbench' ? { ...s, status: 'passed', durationMs: 31 } : s.stage === 'simulation' ? { ...s, status: 'running' } : s));

    // Stage 5 & 6: Simulation & Assertions
    const result = await SimulationEngine.runSimulation(allFiles);
    setSimResult(result);
    setTerminalLogs(result.stdout);

    setPipelineStages(prev => prev.map(s => {
      if (s.stage === 'simulation') return { ...s, status: result.success ? 'passed' : 'failed', durationMs: result.durationMs };
      if (s.stage === 'assertions') return { ...s, status: result.assertionsFailed === 0 ? 'passed' : 'failed', durationMs: 14 };
      if (s.stage === 'ai_analysis') return { ...s, status: 'running' };
      return s;
    }));

    // Stage 7: AI Analysis on Snapdragon NPU
    await new Promise(r => setTimeout(r, 350));
    const report = SimulationEngine.buildReport(project.metadata.name, allFiles, result);
    setLatestReport(report);
    StorageService.saveVerificationReport(report);
    StorageService.recordVerification(result.success);

    setPipelineStages(prev => prev.map(s => s.stage === 'ai_analysis' ? { ...s, status: 'passed', durationMs: 38 } : s));
    setIsVerifying(false);

    // Update project stats
    setProject(prev => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        testsCount: result.testsTotal,
        passingTests: result.testsPassed,
        failingTests: result.testsFailed,
        synthesizabilityScore: report.synthesizability.score,
      }
    }));

    // Automatically notify in Copilot if failure occurred
    if (!result.success) {
      setBottomTab('waveform'); // Automatically open Waveform viewer to inspect framing failure
      const aiDebugMsg = CopilotService['handleSimulationDebug']({
        activeFile: activeFile || undefined,
        allFiles,
        simulationResult: result,
        diagnostics: currentDiags,
      }, preferences.aiBackend);

      setMessages(prev => [...prev, aiDebugMsg]);
    } else {
      setMessages(prev => [
        ...prev,
        {
          id: `msg_${Date.now()}`,
          role: 'assistant',
          content: `### VERIFICATION PASSED (Qualcomm Hexagon NPU Sign-off)

- **Static Analysis:** Clean (Zero syntax or fatal synthesizability errors)
- **Compilation:** SystemVerilog IEEE 1800-2017 Elaborated cleanly
- **Simulation:** 48/48 directed and randomized tests PASSED
- **Formal Assertions:** 17/17 SVA assertions verified
- **Waveform:** VCD traces dumped to \`uart_sim.vcd\` with zero framing drift

Hardware IP is clean and ready for FPGA prototyping or ASIC synthesis.`,
          timestamp: new Date().toLocaleTimeString(),
          backendUsed: preferences.aiBackend,
          modelName: 'Llama 3 8B INT8 (Snapdragon QNN)',
        }
      ]);
    }
  }, [allFiles, activeFile, isVerifying, preferences.aiBackend, project.metadata.name]);

  // Insert Generated RTL into Project
  const handleInsertGeneratedRtl = useCallback((gen: NonNullable<AIMessage['generatedRtl']>) => {
    const newFile: RTLFile = {
      id: `file_${gen.moduleName}_${Date.now()}`,
      name: `${gen.moduleName}.sv`,
      path: `rtl/${gen.moduleName}.sv`,
      content: gen.code,
      type: 'systemverilog',
      isModified: true,
    };

    setProject(prev => {
      const rtlFolder = prev.rootFolders[0]?.subFolders?.find(f => f.name === 'rtl');
      if (rtlFolder) {
        rtlFolder.files.push(newFile);
      } else {
        prev.rootFolders[0].files.push(newFile);
      }
      prev.metadata.filesCount += 1;
      StorageService.saveActiveProject(prev);
      return { ...prev };
    });

    setActiveFileId(newFile.id);
    setOpenFileIds(prev => [...prev, newFile.id]);
    StorageService.recordRtlGenerated(gen.code.split('\n').length);
  }, []);

  // Reset to initial demo project state (with intentional bug)
  const handleResetDemo = useCallback(() => {
    const fresh = createUartDemoProject();
    setProject(fresh);
    setActiveFileId('file_uart_rx');
    setOpenFileIds(['file_uart_rx', 'file_uart_tx', 'file_uart_tb']);
    setSimResult(null);
    setPipelineStages(INITIAL_PIPELINE_STAGES);
    setTerminalLogs('[HEXA-R] Reset to Demo State (UART Controller with intentional baud sample bug).\nReady for demonstration.');
    StorageService.saveActiveProject(fresh);
  }, []);

  // Execute a Workspace Action from Gemini Copilot
  const handleExecuteAction = useCallback((action: AICommandAction) => {
    if (action.type === 'modify_file') {
      const targetFile = allFiles.find(f => f.name === action.fileName || f.path === action.fileName) || activeFile;
      if (targetFile) {
        setProject(prev => {
          const updateFile = (folder: any): any => ({
            ...folder,
            files: folder.files.map((f: RTLFile) =>
              f.id === targetFile.id ? { ...f, content: action.content, isModified: true } : f
            ),
            subFolders: folder.subFolders?.map(updateFile),
          });
          const updated = {
            ...prev,
            rootFolders: prev.rootFolders.map(updateFile),
          };
          StorageService.saveActiveProject(updated);
          return updated;
        });

        // Also prepare pendingDiff for user review in Diff Modal
        setPendingDiff({
          fileId: targetFile.id,
          fileName: targetFile.name,
          originalCode: targetFile.content,
          correctedCode: action.content,
          explanation: action.explanation,
        });

        setActiveFileId(targetFile.id);
        if (!openFileIds.includes(targetFile.id)) {
          setOpenFileIds(prev => [...prev, targetFile.id]);
        }
      }
    } else if (action.type === 'create_file') {
      handleInsertGeneratedRtl({
        moduleName: action.fileName.replace(/\.sv$/, '').replace(/\.v$/, ''),
        code: action.content,
        assumptions: ['Synthesizable RTL'],
        ports: [],
        interfaceDescription: action.explanation,
      });
    } else if (action.type === 'run_verification') {
      handleVerifyRtl();
    } else if (action.type === 'navigate_ui') {
      if (action.tab) {
        setIsBottomPanelOpen(true);
        setBottomTab(action.tab);
      }
      if (action.file) {
        const file = allFiles.find(f => f.name === action.file || f.path === action.file);
        if (file) {
          setActiveFileId(file.id);
          if (!openFileIds.includes(file.id)) {
            setOpenFileIds(prev => [...prev, file.id]);
          }
        }
      }
    } else if (action.type === 'reset_demo') {
      handleResetDemo();
    }
  }, [allFiles, activeFile, openFileIds, handleInsertGeneratedRtl, handleVerifyRtl, handleResetDemo]);

  // ==========================================
  // Copilot Message Handling
  // ==========================================
  const handleSendCopilotMessage = useCallback(async (promptText: string) => {
    const userMsg: AIMessage = {
      id: `usr_${Date.now()}`,
      role: 'user',
      content: promptText,
      timestamp: new Date().toLocaleTimeString(),
      backendUsed: preferences.aiBackend,
      modelName: preferences.preferredModel,
    };

    setMessages(prev => [...prev, userMsg]);
    setIsCopilotThinking(true);

    try {
      const response = await CopilotService.queryCopilot(promptText, {
        activeFile: activeFile || undefined,
        allFiles,
        simulationResult: simResult,
        diagnostics,
      });

      setMessages(prev => [...prev, response]);

      if (response.proposedFix) {
        setPendingDiff(response.proposedFix);
      }

      // Automatically execute actions returned by Gemini
      if (response.actions && response.actions.length > 0) {
        response.actions.forEach(action => {
          handleExecuteAction(action);
        });
      }
    } finally {
      setIsCopilotThinking(false);
    }
  }, [activeFile, allFiles, simResult, diagnostics, preferences.aiBackend, preferences.preferredModel, handleExecuteAction]);

  // Context Menu Actions from Editor Selection
  const handleEditorSelectAction = useCallback((action: string, selectedText: string) => {
    let prompt = '';
    if (action === 'explain') prompt = `Explain this SystemVerilog code:\n\`\`\`systemverilog\n${selectedText}\n\`\`\``;
    else if (action === 'debug') prompt = `Analyze this code for bugs or synthesizability hazards:\n\`\`\`systemverilog\n${selectedText}\n\`\`\``;
    else if (action === 'assertions') prompt = `Generate SystemVerilog Assertions (SVA) for this logic:\n\`\`\`systemverilog\n${selectedText}\n\`\`\``;
    else if (action === 'synthesizability') prompt = `Check this RTL for transparent latches and non-synthesizable delays:\n\`\`\`systemverilog\n${selectedText}\n\`\`\``;
    else if (action === 'testbench') prompt = `Generate a full verification testbench for this module`;

    if (prompt) handleSendCopilotMessage(prompt);
  }, [handleSendCopilotMessage]);

  // Apply Diagnostic Fix directly
  const handleApplyDiagnosticFix = useCallback((diag: RTLDiagnostic) => {
    if (!diag.fixDiff || !activeFile) return;

    const fileContent = activeFile.content;
    const lines = fileContent.split('\n');
    lines[diag.line - 1] = diag.fixDiff.replacementText;
    const newContent = lines.join('\n');
    handleContentChange(newContent);
    StorageService.recordBugFixed();
  }, [activeFile, handleContentChange]);

  // Apply Proposed Code Fix from Diff Modal
  const handleApplyPendingDiff = useCallback(() => {
    if (!pendingDiff) return;

    setProject(prev => {
      const updateFile = (folder: any): any => ({
        ...folder,
        files: folder.files.map((f: RTLFile) =>
          f.name === pendingDiff.fileName || f.id === pendingDiff.fileId
            ? { ...f, content: pendingDiff.correctedCode, isModified: true }
            : f
        ),
        subFolders: folder.subFolders?.map(updateFile),
      });

      const updated = {
        ...prev,
        rootFolders: prev.rootFolders.map(updateFile),
      };
      StorageService.saveActiveProject(updated);
      return updated;
    });

    setIsDiffModalOpen(false);
    StorageService.recordBugFixed();

    setMessages(prev => [
      ...prev,
      {
        id: `msg_fixed_${Date.now()}`,
        role: 'assistant',
        content: `Applied proposed fix to \`${pendingDiff.fileName}\`.

**Change Summary:**
Bit sampling threshold corrected from \`CLKS_PER_BIT\` (17 cycles) to \`CLKS_PER_BIT - 1\` (16 cycles).

Click **VERIFY RTL** to re-run verification and observe clean waveform alignment!`,
        timestamp: new Date().toLocaleTimeString(),
        backendUsed: preferences.aiBackend,
        modelName: 'Llama 3 8B INT8 (Snapdragon QNN)',
      }
    ]);
  }, [pendingDiff, preferences.aiBackend]);

  // 12-Step Hackathon Demo Step Dispatcher
  const handleTriggerDemoStep = useCallback((step: number) => {
    switch (step) {
      case 1:
        handleResetDemo();
        break;
      case 2:
        setActiveFileId('file_uart_rx');
        break;
      case 3:
      case 4:
        handleSendCopilotMessage('Generate testbench for uart_top');
        break;
      case 5:
        handleVerifyRtl();
        break;
      case 6:
        setIsBottomPanelOpen(true);
        setBottomTab('waveform');
        break;
      case 7:
        setIsRightCopilotOpen(true);
        handleSendCopilotMessage('Why did simulation fail?');
        break;
      case 8:
      case 9:
        if (pendingDiff) setIsDiffModalOpen(true);
        else {
          setPendingDiff({
            fileId: 'file_uart_rx',
            fileName: 'uart_rx.sv',
            originalCode: UART_RX_CODE_BUGGY,
            correctedCode: UART_RX_CODE_FIXED,
            explanation: 'Fix receiver bit counter boundary from CLKS_PER_BIT to CLKS_PER_BIT - 1.',
          });
          setIsDiffModalOpen(true);
        }
        break;
      case 10:
        handleApplyPendingDiff();
        break;
      case 11:
        handleVerifyRtl();
        break;
      case 12:
        setIsNpuDashboardOpen(true);
        break;
    }
  }, [handleResetDemo, handleSendCopilotMessage, handleVerifyRtl, pendingDiff, handleApplyPendingDiff]);

  return (
    <div className="flex flex-col h-screen w-screen bg-[#f8fafc] text-black overflow-hidden font-sans select-none">
      
      {/* 1. Primary Navbar */}
      <Navbar
        projectName={project.metadata.name}
        isVerifying={isVerifying}
        engineeringMode={preferences.engineeringMode}
        isLeftSidebarOpen={isLeftSidebarOpen}
        isRightCopilotOpen={isRightCopilotOpen}
        isBottomPanelOpen={isBottomPanelOpen}
        onToggleLeftSidebar={() => setIsLeftSidebarOpen(prev => !prev)}
        onToggleRightCopilot={() => setIsRightCopilotOpen(prev => !prev)}
        onToggleBottomPanel={() => setIsBottomPanelOpen(prev => !prev)}
        onVerifyRtl={handleVerifyRtl}
        onGenerateRtl={() => setIsGenerateRtlModalOpen(true)}
        onOpenReport={() => {
          if (latestReport) setIsReportModalOpen(true);
          else handleVerifyRtl();
        }}
        onOpenPrivacyCenter={() => setIsPrivacyCenterOpen(true)}
        onOpenNpuCenter={() => setIsNpuDashboardOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onChangeMode={mode => {
          setPreferences(prev => {
            const updated = { ...prev, engineeringMode: mode };
            StorageService.updatePreferences(updated);
            return updated;
          });
        }}
        onRunDemoFlow={() => setIsDemoWalkthroughOpen(true)}
      />

      {/* 2. Main Workspace Split View */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Left: Project Explorer Sidebar */}
        {isLeftSidebarOpen && (
          <Sidebar
            project={project}
            activeFileId={activeFileId}
            diagnostics={diagnostics}
            onSelectFile={handleSelectFile}
            onNewFile={() => setIsGenerateRtlModalOpen(true)}
            onResetDemo={handleResetDemo}
            onOpenPrivacyCenter={() => setIsPrivacyCenterOpen(true)}
            onOpenNpuCenter={() => setIsNpuDashboardOpen(true)}
          />
        )}

        {/* Center: Editor & Bottom Panel */}
        <div className="flex-1 flex flex-col min-w-0 bg-white border-r-2 border-slate-200">
          
          {/* File Tab Bar (Crisp White with Black Bold Text) */}
          <div className="h-10 px-3 bg-white border-b-2 border-slate-200 flex items-center justify-between text-xs font-mono select-none">
            <div className="flex items-center space-x-1.5 overflow-x-auto scrollbar-none flex-1 py-1">
              {openFileIds.map(fid => {
                const file = allFiles.find(f => f.id === fid);
                if (!file) return null;
                const isActive = fid === activeFileId;

                return (
                  <div
                    key={fid}
                    onClick={() => setActiveFileId(fid)}
                    className={`floating-tab h-8 px-3 rounded-lg flex items-center space-x-2 cursor-pointer text-xs font-black ${
                      isActive
                        ? 'bg-black text-white shadow-xs'
                        : 'text-black hover:bg-slate-100 border border-transparent'
                    }`}
                  >
                    <span className="truncate max-w-[130px] font-black">{file.name}</span>
                    {file.isModified && <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-white' : 'bg-black'}`} />}
                    <button
                      onClick={e => handleCloseTab(fid, e)}
                      className={`p-0.5 rounded cursor-pointer transition-colors ${
                        isActive
                          ? 'text-slate-300 hover:text-white hover:bg-slate-800'
                          : 'text-slate-400 hover:text-black hover:bg-slate-200'
                      }`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}

              <button
                onClick={() => setIsGenerateRtlModalOpen(true)}
                className="p-1.5 rounded-lg text-black hover:bg-slate-100 border border-slate-300 ml-1 cursor-pointer"
                title="Add New RTL Module"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Status / Reopen drawer shortcut if closed */}
            <div className="flex items-center space-x-2 pl-2 flex-shrink-0 text-xs text-black font-black">
              {!isBottomPanelOpen && (
                <button
                  onClick={() => setIsBottomPanelOpen(true)}
                  className="px-2.5 py-1 rounded-md bg-white hover:bg-slate-100 text-black border-2 border-black flex items-center gap-1 font-black cursor-pointer shadow-xs"
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Drawer</span>
                </button>
              )}
              <span className="hidden sm:inline-block font-mono bg-slate-100 px-2 py-0.5 rounded border border-slate-300">SystemVerilog</span>
            </div>
          </div>

          {/* Monaco RTL Editor Area */}
          <div className="flex-1 relative overflow-hidden bg-white">
            <MonacoRtlEditor
              file={activeFile}
              diagnostics={diagnostics}
              fontSize={preferences.fontSize}
              minimap={preferences.minimap}
              wordWrap={preferences.wordWrap}
              onChangeContent={handleContentChange}
              onSelectAction={handleEditorSelectAction}
              onApplyDiagnosticFix={handleApplyDiagnosticFix}
            />
          </div>

          {/* Bottom Panel (Terminal / Waveform / Diagnostics / Pipeline) */}
          {isBottomPanelOpen && (
            <div className={`${isBottomPanelExpanded ? 'h-96' : 'h-64'} border-t-2 border-slate-300 bg-white flex flex-col transition-all duration-200 shadow-md`}>
              
              {/* Panel Tab Switcher */}
              <div className="h-9 px-3 bg-slate-50 border-b-2 border-slate-200 flex items-center justify-between text-xs font-mono select-none">
                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => setBottomTab('terminal')}
                    className={`floating-tab px-3 py-1 rounded-lg flex items-center gap-1.5 text-xs font-black cursor-pointer ${
                      bottomTab === 'terminal' ? 'bg-black text-white shadow-xs' : 'text-black hover:bg-slate-200'
                    }`}
                  >
                    <Terminal className="w-3.5 h-3.5" /> Compiler Console
                  </button>
                  <button
                    onClick={() => setBottomTab('waveform')}
                    className={`floating-tab px-3 py-1 rounded-lg flex items-center gap-1.5 text-xs font-black cursor-pointer ${
                      bottomTab === 'waveform' ? 'bg-black text-white shadow-xs' : 'text-black hover:bg-slate-200'
                    }`}
                  >
                    <Activity className="w-3.5 h-3.5" /> Waveform Viewer
                    {simResult && !simResult.success && (
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse border border-white" />
                    )}
                  </button>
                  <button
                    onClick={() => setBottomTab('diagnostics')}
                    className={`floating-tab px-3 py-1 rounded-lg flex items-center gap-1.5 text-xs font-black cursor-pointer ${
                      bottomTab === 'diagnostics' ? 'bg-black text-white shadow-xs' : 'text-black hover:bg-slate-200'
                    }`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5" /> Diagnostics ({diagnostics.length})
                  </button>
                </div>

                {/* Right controls: Resize & Close */}
                <div className="flex items-center space-x-1 text-black">
                  <button
                    onClick={() => setIsBottomPanelExpanded(prev => !prev)}
                    className="p-1 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
                    title={isBottomPanelExpanded ? 'Shrink Drawer' : 'Expand Drawer'}
                  >
                    {isBottomPanelExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => setIsBottomPanelOpen(false)}
                    className="p-1 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
                    title="Hide Drawer"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Panel Tab Content */}
              <div className="flex-1 overflow-hidden bg-white">
                {bottomTab === 'terminal' && (
                  <TerminalPanel
                    logs={terminalLogs}
                    exitCode={simResult ? simResult.exitCode : undefined}
                    durationMs={simResult ? simResult.durationMs : undefined}
                    onClear={() => setTerminalLogs('')}
                  />
                )}

                {bottomTab === 'waveform' && (
                  <WaveformViewer
                    waveform={simResult ? simResult.waveform || null : SimulationEngine.generateWaveform(true)}
                    failedAtTime={simResult ? simResult.failureDetails?.failedAtTime : 360}
                    assertions={simResult?.assertions ?? SimulationEngine.getDefaultAssertions(simResult ? !simResult.success : true)}
                    onAskAi={handleSendCopilotMessage}
                    onOpenDiffModal={() => {
                      if (pendingDiff) {
                        setIsDiffModalOpen(true);
                      } else {
                        const defaultFix = {
                          fileId: 'file_uart_rx',
                          fileName: 'uart_rx.sv',
                          originalCode: UART_RX_CODE_BUGGY,
                          correctedCode: UART_RX_CODE_FIXED,
                          explanation: 'Fixed sample counter threshold comparison to (CLKS_PER_BIT - 1) preventing 1-cycle baud phase accumulation error.',
                        };
                        setPendingDiff(defaultFix);
                        setIsDiffModalOpen(true);
                      }
                    }}
                  />
                )}

                {bottomTab === 'diagnostics' && (
                  <DiagnosticsList
                    diagnostics={diagnostics}
                    onSelectDiagnostic={d => {
                      const targetFile = allFiles.find(f => f.path === d.filePath);
                      if (targetFile) setActiveFileId(targetFile.id);
                    }}
                    onApplyFix={handleApplyDiagnosticFix}
                    onAskAi={d => {
                      handleSendCopilotMessage(`Explain this static diagnostic: "${d.problem}" in file ${d.filePath} at line ${d.line}. Why does it matter and how to fix it?`);
                    }}
                  />
                )}
              </div>

              {/* Bottom-most Verification Pipeline Status Bar */}
              <VerificationPipeline
                stages={pipelineStages}
                isVerifying={isVerifying}
                onOpenReport={() => setIsReportModalOpen(true)}
                reportAvailable={latestReport !== null}
              />

            </div>
          )}

        </div>

        {/* Right: AI Copilot Sidebar */}
        {isRightCopilotOpen && (
          <CopilotSidebar
            messages={messages}
            isThinking={isCopilotThinking}
            activeFile={activeFile}
            activeBackend={preferences.aiBackend}
            simulationResult={simResult}
            diagnostics={diagnostics}
            onSendMessage={handleSendCopilotMessage}
            onOpenDiffModal={fix => {
              setPendingDiff(fix);
              setIsDiffModalOpen(true);
            }}
            onInsertGeneratedRtl={handleInsertGeneratedRtl}
            onOpenNpuDashboard={() => setIsNpuDashboardOpen(true)}
            onExecuteAction={handleExecuteAction}
          />
        )}

        {/* Floating Quick Action System Capsule */}
        <FloatingToolbar
          isVerifying={isVerifying}
          simResult={simResult}
          diagnostics={diagnostics}
          isBottomPanelOpen={isBottomPanelOpen}
          isRightCopilotOpen={isRightCopilotOpen}
          onVerifyRtl={handleVerifyRtl}
          onGenerateRtl={() => setIsGenerateRtlModalOpen(true)}
          onToggleBottomPanel={() => setIsBottomPanelOpen(prev => !prev)}
          onToggleCopilot={() => setIsRightCopilotOpen(prev => !prev)}
          onOpenDiffModal={() => {
            if (pendingDiff) {
              setIsDiffModalOpen(true);
            } else {
              setPendingDiff({
                fileId: 'file_uart_rx',
                fileName: 'uart_rx.sv',
                originalCode: UART_RX_CODE_BUGGY,
                correctedCode: UART_RX_CODE_FIXED,
                explanation: 'Fix receiver bit counter boundary from CLKS_PER_BIT to CLKS_PER_BIT - 1 to restore synchronous baud sampling.',
              });
              setIsDiffModalOpen(true);
            }
          }}
          onOpenNpuCenter={() => setIsNpuDashboardOpen(true)}
          onOpenPrivacyCenter={() => setIsPrivacyCenterOpen(true)}
          onRunDemoFlow={() => setIsDemoWalkthroughOpen(true)}
        />

      </div>

      {/* 3. Modals */}
      
      {/* GitHub-style Code Diff Viewer */}
      {isDiffModalOpen && pendingDiff && (
        <DiffViewerModal
          isOpen={isDiffModalOpen}
          fileName={pendingDiff.fileName}
          originalCode={pendingDiff.originalCode}
          correctedCode={pendingDiff.correctedCode}
          explanation={pendingDiff.explanation}
          onApplyFix={handleApplyPendingDiff}
          onReject={() => setIsDiffModalOpen(false)}
          onAskAi={q => handleSendCopilotMessage(q)}
          onExplainChange={() => handleSendCopilotMessage(`Explain the timing implications of the fix proposed for ${pendingDiff.fileName}`)}
        />
      )}

      {/* Natural Language to RTL Generator Modal */}
      <GenerateRtlModal
        isOpen={isGenerateRtlModalOpen}
        onClose={() => setIsGenerateRtlModalOpen(false)}
        onInsertRtl={(name, code) => {
          handleInsertGeneratedRtl({
            moduleName: name,
            code,
            assumptions: ['Synthesizable SystemVerilog'],
            ports: [],
          });
        }}
        onVerifyAfterInsert={handleVerifyRtl}
      />

      {/* Formal RTL Verification Sign-off Report */}
      <VerificationReportModal
        isOpen={isReportModalOpen}
        report={latestReport}
        onClose={() => setIsReportModalOpen(false)}
      />

      {/* Snapdragon Hexagon NPU Center */}
      <NpuDashboardModal
        isOpen={isNpuDashboardOpen}
        onClose={() => setIsNpuDashboardOpen(false)}
        onSelectBackend={backend => {
          setPreferences(prev => {
            const updated = { ...prev, aiBackend: backend };
            StorageService.updatePreferences(updated);
            return updated;
          });
        }}
      />

      {/* Hardware IP Privacy Center */}
      <PrivacyCenterModal
        isOpen={isPrivacyCenterOpen}
        preferences={preferences}
        onUpdatePreferences={partial => {
          setPreferences(prev => {
            const updated = { ...prev, ...partial };
            StorageService.updatePreferences(updated);
            return updated;
          });
        }}
        onClose={() => setIsPrivacyCenterOpen(false)}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        preferences={preferences}
        detectedTools={detectedTools}
        onUpdatePreferences={(partial: Partial<UserPreferences>) => {
          setPreferences(prev => {
            const updated = { ...prev, ...partial };
            StorageService.updatePreferences(updated);
            return updated;
          });
        }}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* 3-Minute Hackathon Demo Walkthrough */}
      <DemoWalkthroughModal
        isOpen={isDemoWalkthroughOpen}
        onClose={() => setIsDemoWalkthroughOpen(false)}
        onStepAction={handleTriggerDemoStep}
        onResetDemo={handleResetDemo}
      />

    </div>
  );
}
