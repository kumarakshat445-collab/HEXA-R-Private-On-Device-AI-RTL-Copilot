/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * HEXA-R Core Data Schema & Types
 * Private On-Device AI Copilot for RTL Engineering
 */

// ==========================================
// 1. User Profile & Preferences
// ==========================================

export type EngineeringMode = 'beginner' | 'student' | 'professional';

export type AIBackendType = 
  | 'snapdragon_npu'      // Qualcomm Hexagon NPU via QNN / AI Hub
  | 'onnx_runtime_local'  // Local ONNX Runtime (INT8/FP16)
  | 'cpu_fallback'        // CPU execution fallback
  | 'rule_based_fallback' // Deterministic rule-based RTL analyzer
  | 'cloud_opt_in'       // Cloud AI (Strictly opt-in, disabled by default)
  | 'gemini_api';        // Gemini API Cloud Model (gemini-3.8-flash)

export interface UserProfile {
  id: string;
  name: string;
  role: string;
  organization?: string;
  experienceLevel: EngineeringMode;
  createdAt: string;
  lastActiveAt: string;
  preferences: UserPreferences;
  stats: UserEngineeringStats;
}

export interface UserPreferences {
  theme: 'graphite-dark' | 'midnight' | 'high-contrast-dark';
  fontSize: number;
  tabSize: number;
  minimap: boolean;
  wordWrap: boolean;
  autoSave: boolean;
  engineeringMode: EngineeringMode;
  aiBackend: AIBackendType;
  preferredModel: string;
  selectedModel?: string;
  temperature?: number;
  enableNpuAcceleration?: boolean;
  offlineOnly?: boolean;
  allowCloudFallback?: boolean;
  allowCloudAI: boolean;          // STRICTLY OFF BY DEFAULT (Privacy requirement)
  telemetryEnabled: boolean;      // STRICTLY OFF BY DEFAULT
  localWorkspacePath: string;
  verilatorPath: string;
  iverilogPath: string;
  yosysPath: string;
  qnnRuntimePath: string;
}

export interface UserEngineeringStats {
  projectsCount: number;
  verificationsRun: number;
  bugsFixedByAI: number;
  linesOfRtlGenerated: number;
  totalSimulations: number;
  lastVerificationDate?: string;
}

// ==========================================
// 2. Project & RTL File Tree
// ==========================================

export type FileType = 'verilog' | 'systemverilog' | 'testbench' | 'report' | 'constraint' | 'waveform' | 'markdown';

export interface RTLFile {
  id: string;
  name: string;
  path: string;
  content: string;
  type: FileType;
  isModified?: boolean;
  isTestbench?: boolean;
  isTopModule?: boolean;
  readOnly?: boolean;
}

export interface ProjectFolder {
  id: string;
  name: string;
  path: string;
  files: RTLFile[];
  subFolders?: ProjectFolder[];
}

export interface ProjectMetadata {
  id: string;
  name: string;
  description: string;
  topModule: string;
  createdAt: string;
  updatedAt: string;
  targetDevice?: string; // e.g., 'Snapdragon X Elite', 'General ASIC/FPGA'
  filesCount: number;
  testbenchCount: number;
  testsCount: number;
  passingTests: number;
  failingTests: number;
  synthesizabilityScore: number; // 0-100%
}

export interface Project {
  metadata: ProjectMetadata;
  rootFolders: ProjectFolder[];
  activeFileId: string;
  openFileIds: string[];
}

// ==========================================
// 3. Static RTL Analyzer & Diagnostics
// ==========================================

export type DiagnosticSeverity = 'error' | 'warning' | 'info' | 'hint';

export type DiagnosticCategory = 
  | 'syntax'
  | 'synthesizability'
  | 'latch_inference'
  | 'blocking_assignment_misuse'
  | 'unused_signal'
  | 'width_mismatch'
  | 'implicit_net'
  | 'race_condition'
  | 'clock_domain'
  | 'code_quality';

export interface RTLDiagnostic {
  id: string;
  fileId: string;
  filePath: string;
  line: number;
  column?: number;
  endLine?: number;
  endColumn?: number;
  severity: DiagnosticSeverity;
  category: DiagnosticCategory;
  problem: string;
  whyItMatters: string;
  suggestedFix?: string;
  autoFixAvailable?: boolean;
  codeSnippet?: string;
  fixDiff?: {
    originalText: string;
    replacementText: string;
    range: {
      startLineNumber: number;
      startColumn: number;
      endLineNumber: number;
      endColumn: number;
    };
  };
}

// ==========================================
// 4. Simulation & Verification Pipeline
// ==========================================

export type VerificationStage = 
  | 'idle'
  | 'parse'
  | 'static_analysis'
  | 'compile'
  | 'testbench'
  | 'simulation'
  | 'assertions'
  | 'ai_analysis'
  | 'complete'
  | 'failed';

export interface StageStatus {
  stage: VerificationStage;
  label: string;
  status: 'pending' | 'running' | 'passed' | 'failed' | 'skipped';
  durationMs?: number;
  message?: string;
}

export interface AssertionResult {
  id: string;
  name: string;
  file: string;
  line: number;
  status: 'passed' | 'failed';
  expression: string;
  timestamp?: number;
  failureMessage?: string;
}

export interface SimulationTraceSignal {
  name: string;
  type: 'wire' | 'reg' | 'logic' | 'clock';
  width: number;
  values: { time: number; value: string | number }[];
}

export interface WaveformTrace {
  timeUnit: 'ps' | 'ns' | 'us';
  timePrecision: number;
  startTime: number;
  endTime: number;
  signals: SimulationTraceSignal[];
}

export interface SimulationResult {
  success: boolean;
  exitCode: number;
  stdout: string;
  stderr: string;
  durationMs: number;
  testsTotal: number;
  testsPassed: number;
  testsFailed: number;
  assertionsTotal: number;
  assertionsPassed: number;
  assertionsFailed: number;
  waveform?: WaveformTrace;
  failureDetails?: {
    testName?: string;
    failedAtTime?: number;
    expectedValue?: string;
    actualValue?: string;
    relevantModule?: string;
    relevantLine?: number;
    stackTrace?: string;
  };
  assertions?: AssertionResult[];
}

export interface VerificationReport {
  id: string;
  projectName: string;
  timestamp: string;
  overallStatus: 'PASS' | 'FAIL';
  staticAnalysis: {
    errorsCount: number;
    warningsCount: number;
    diagnostics: RTLDiagnostic[];
  };
  compilation: {
    status: 'PASS' | 'FAIL';
    compiler: string;
    output: string;
  };
  simulation: {
    status: 'PASS' | 'FAIL';
    simulator: string;
    durationMs: number;
  };
  tests: {
    total: number;
    passed: number;
    failed: number;
  };
  assertions: {
    total: number;
    passed: number;
    failed: number;
    items: AssertionResult[];
  };
  synthesizability: {
    status: 'PASS' | 'WARNING' | 'FAIL';
    score: number;
    inferredLatches: number;
    potentialClockIssues: number;
  };
  aiReview: {
    summary: string;
    improvements: string[];
    rootCauseAnalysis?: string;
    suggestedFix?: string;
  };
}

// ==========================================
// 5. AI Copilot & Router
// ==========================================

export type AITaskType = 
  | 'rtl_generation'
  | 'code_explanation'
  | 'static_analysis'
  | 'compilation_check'
  | 'testbench_generation'
  | 'synthesizability_check'
  | 'debugging'
  | 'verification'
  | 'optimization'
  | 'assertion_generation';

export type AICommandAction = 
  | { type: 'modify_file'; fileName: string; content: string; explanation: string; applied?: boolean }
  | { type: 'create_file'; fileName: string; path: string; content: string; explanation?: string; applied?: boolean }
  | { type: 'run_verification'; reason: string; triggered?: boolean }
  | { type: 'navigate_ui'; tab?: 'terminal' | 'waveform' | 'diagnostics'; file?: string; waveformTime?: number; reason?: string }
  | { type: 'reset_demo'; reason: string };

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  backendUsed: AIBackendType;
  modelName: string;
  taskType?: AITaskType;
  proposedFix?: {
    fileId: string;
    fileName: string;
    originalCode: string;
    correctedCode: string;
    explanation: string;
    applied?: boolean;
  };
  generatedRtl?: {
    moduleName: string;
    code: string;
    assumptions: string[];
    ports: string[];
    interfaceDescription?: string;
  };
  actions?: AICommandAction[];
}

export interface NPUPerformanceMetrics {
  backendName: string;
  status: 'Active' | 'Fallback' | 'Unavailable';
  modelName: string;
  precision: 'INT8' | 'FP16' | 'INT4' | 'CPU Float32';
  executionLocation: 'On-device (Hexagon NPU)' | 'On-device (CPU)' | 'Rule Engine' | 'Cloud (Opt-in)';
  networkStatus: 'Offline' | 'Online (Cloud Opt-in)';
  latencyMs?: number;
  tokensPerSec?: number;
  npuUtilization?: number;
  cpuUtilization?: number;
  memoryUsageMb?: number;
  isRealTelemetryAvailable: boolean; // Must not invent fake telemetry!
}

export interface QualcommModelMetadata {
  id: string;
  name: string;
  sizeMb: number;
  parameters: string;
  quantization: 'INT8' | 'INT4' | 'FP16';
  targetHardware: 'Snapdragon X Elite / Hexagon NPU' | 'Any ONNX' | 'Qualcomm QNN';
  isInstalled: boolean;
  status: 'Ready' | 'Download Available' | 'Optimized';
  supportedTasks: AITaskType[];
}

// ==========================================
// 6. Installed Tools Environment
// ==========================================

export interface DetectedTools {
  iverilog: { installed: boolean; version?: string; path?: string };
  verilator: { installed: boolean; version?: string; path?: string };
  yosys: { installed: boolean; version?: string; path?: string };
  snapdragonQNN: { installed: boolean; version?: string; path?: string };
  inMemorySimulator: { installed: boolean; version: string }; // Built-in cycle-accurate simulator
}
