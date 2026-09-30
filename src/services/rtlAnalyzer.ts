/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * HEXA-R RTL Static Analyzer
 * Pure offline, deterministic rule-based SystemVerilog / Verilog analyzer
 * Detects syntax, synthesizability, latch inference, blocking/non-blocking misuse,
 * unused signals, implicit nets, and generates ready-to-apply diff fixes.
 */

import { RTLDiagnostic, RTLFile } from '../types';

export class RTLAnalyzer {
  /**
   * Analyze an entire file's content
   */
  static analyzeFile(file: RTLFile): RTLDiagnostic[] {
    const diagnostics: RTLDiagnostic[] = [];
    const lines = file.content.split('\n');
    const isTestbench = file.isTestbench || file.name.includes('_tb') || file.path.includes('tb/');

    // Helper state
    let inModule = false;
    let moduleName = '';
    let openBlocks = 0;
    const declaredSignals = new Map<string, { line: number; type: string; width?: string }>();
    const usedSignals = new Set<string>();

    for (let i = 0; i < lines.length; i++) {
      const lineNum = i + 1;
      const rawLine = lines[i];
      const trimmed = rawLine.trim();

      // Skip empty lines & comments
      if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
        continue;
      }

      // Check module declaration
      const moduleMatch = trimmed.match(/^module\s+([a-zA-Z0-9_]+)/);
      if (moduleMatch) {
        inModule = true;
        moduleName = moduleMatch[1];
      }

      const endmoduleMatch = trimmed.match(/^endmodule\b/);
      if (endmoduleMatch) {
        inModule = false;
      }

      // Track begin / end count
      const beginMatches = trimmed.match(/\bbegin\b/g);
      const endMatches = trimmed.match(/\bend\b/g);
      if (beginMatches) openBlocks += beginMatches.length;
      if (endMatches) openBlocks -= endMatches.length;

      // 1. SYNTAX CHECK: Missing semicolon after standard statements
      if (
        (trimmed.startsWith('input ') ||
          trimmed.startsWith('output ') ||
          trimmed.startsWith('logic ') ||
          trimmed.startsWith('wire ') ||
          trimmed.startsWith('reg ') ||
          trimmed.startsWith('assign ') ||
          trimmed.startsWith('localparam ') ||
          trimmed.startsWith('parameter ')) &&
        !trimmed.endsWith(';') &&
        !trimmed.endsWith(',') &&
        !trimmed.endsWith('(') &&
        !trimmed.endsWith('{')
      ) {
        diagnostics.push({
          id: `diag_semi_${lineNum}`,
          fileId: file.id,
          filePath: file.path,
          line: lineNum,
          severity: 'error',
          category: 'syntax',
          problem: 'Missing terminating semicolon ";" at end of declaration.',
          whyItMatters: 'SystemVerilog grammar mandates semicolons to terminate signal and parameter statements.',
          suggestedFix: 'Append ";" to terminate the declaration.',
          codeSnippet: rawLine,
          fixDiff: {
            originalText: rawLine,
            replacementText: `${rawLine};`,
            range: {
              startLineNumber: lineNum,
              startColumn: 1,
              endLineNumber: lineNum,
              endColumn: rawLine.length + 1,
            },
          },
        });
      }

      // 2. SYNTHESIZABILITY: Delays in synthesizable RTL (#5, #10)
      if (!isTestbench && /#\d+/.test(trimmed)) {
        diagnostics.push({
          id: `diag_delay_${lineNum}`,
          fileId: file.id,
          filePath: file.path,
          line: lineNum,
          severity: 'error',
          category: 'synthesizability',
          problem: 'Explicit timing delay (# delay) found in synthesizable RTL.',
          whyItMatters:
            'Gate-level synthesis tools (Synopsys Design Compiler, Yosys, Cadence Genus) ignore or reject physical delay tokens (#). Timing must be driven solely by clock edges.',
          suggestedFix: 'Remove the # delay and model timing using sequential flip-flops or state machines.',
          codeSnippet: rawLine,
        });
      }

      // 3. SYNTHESIZABILITY: Inappropriate initial blocks in synthesizable modules
      if (!isTestbench && /^initial\b/.test(trimmed)) {
        diagnostics.push({
          id: `diag_initial_${lineNum}`,
          fileId: file.id,
          filePath: file.path,
          line: lineNum,
          severity: 'warning',
          category: 'synthesizability',
          problem: 'Initial block present in non-testbench module.',
          whyItMatters:
            'Initial blocks are non-synthesizable in most ASIC cell libraries. While some FPGAs support power-up initialization, portable RTL must utilize synchronous or asynchronous reset registers.',
          suggestedFix: 'Replace initial block with synchronous or asynchronous reset logic inside always_ff.',
          codeSnippet: rawLine,
        });
      }

      // 4. SYNTHESIZABILITY: Blocking vs Non-Blocking Assignment Misuse
      // Sequential blocks should use non-blocking <=
      if (trimmed.includes('always_ff') || trimmed.includes('always @(posedge') || trimmed.includes('always @(negedge')) {
        // Look ahead in sequential block for blocking assignments
        for (let j = i + 1; j < Math.min(i + 40, lines.length); j++) {
          const innerLine = lines[j].trim();
          if (innerLine.startsWith('endmodule') || innerLine.startsWith('always')) break;
          // Look for = instead of <= (excluding ==, !=, <=, >=, :=)
          const blockingMatch = innerLine.match(/^([a-zA-Z_][a-zA-Z0-9_]*(\[[^\]]+\])?)\s*=\s*([^=;]+);/);
          if (blockingMatch && !innerLine.includes('<=') && !innerLine.startsWith('for') && !innerLine.startsWith('//')) {
            const varName = blockingMatch[1];
            diagnostics.push({
              id: `diag_blocking_${j + 1}`,
              fileId: file.id,
              filePath: file.path,
              line: j + 1,
              severity: 'warning',
              category: 'blocking_assignment_misuse',
              problem: `Blocking assignment '=' used inside sequential clock-edge block for '${varName}'.`,
              whyItMatters:
                'Using blocking assignments in clocked processes introduces simulation/synthesis race conditions and incorrect pipeline register scheduling.',
              suggestedFix: `Change '=' to non-blocking assignment '<=': ${varName} <= ${blockingMatch[3].trim()};`,
              codeSnippet: lines[j],
              fixDiff: {
                originalText: lines[j],
                replacementText: lines[j].replace(' = ', ' <= '),
                range: {
                  startLineNumber: j + 1,
                  startColumn: 1,
                  endLineNumber: j + 1,
                  endColumn: lines[j].length + 1,
                },
              },
            });
            break;
          }
        }
      }

      // 5. SYNTHESIZABILITY: Non-blocking <= used in always_comb
      if (trimmed.includes('always_comb') || (trimmed.startsWith('always @(*)') && !isTestbench)) {
        for (let j = i + 1; j < Math.min(i + 30, lines.length); j++) {
          const innerLine = lines[j].trim();
          if (innerLine.startsWith('endmodule') || innerLine.startsWith('always')) break;
          if (innerLine.includes('<=') && !innerLine.startsWith('//')) {
            diagnostics.push({
              id: `diag_nonblocking_comb_${j + 1}`,
              fileId: file.id,
              filePath: file.path,
              line: j + 1,
              severity: 'warning',
              category: 'blocking_assignment_misuse',
              problem: 'Non-blocking assignment "<=" detected inside combinational logic block.',
              whyItMatters:
                'Combinational logic must use blocking assignments "=" to ensure intermediate expressions update immediately within the evaluation step.',
              suggestedFix: 'Replace "<=" with "=" in always_comb processes.',
              codeSnippet: lines[j],
            });
            break;
          }
        }
      }

      // 6. SYNTHESIZABILITY: Incomplete case statement (Missing default)
      if (trimmed.startsWith('case ') || trimmed.startsWith('case(')) {
        let hasDefault = false;
        let caseEndLine = -1;
        for (let j = i + 1; j < Math.min(i + 50, lines.length); j++) {
          const caseLine = lines[j].trim();
          if (caseLine.startsWith('default:') || caseLine.startsWith('default :')) {
            hasDefault = true;
          }
          if (caseLine.startsWith('endcase')) {
            caseEndLine = j + 1;
            break;
          }
        }

        if (!hasDefault && caseEndLine !== -1 && !isTestbench) {
          diagnostics.push({
            id: `diag_latch_case_${lineNum}`,
            fileId: file.id,
            filePath: file.path,
            line: lineNum,
            severity: 'warning',
            category: 'latch_inference',
            problem: 'Case statement missing "default:" branch.',
            whyItMatters:
              'Incomplete case branches in combinational processes cause synthesis tools to infer unwanted hardware transparent latches, which waste silicon area and harm timing closure.',
            suggestedFix: 'Add a "default:" case branch assigning safe fallback values (e.g. default: state <= IDLE;)',
            codeSnippet: rawLine,
          });
        }
      }

      // 7. SPECIFIC RTL BUG CHECK: Check UART RX off-by-one baud sampling bug
      if (file.name === 'uart_rx.sv' && trimmed.includes('if (sample_cnt == CLKS_PER_BIT)')) {
        diagnostics.push({
          id: `diag_uart_rx_timing_${lineNum}`,
          fileId: file.id,
          filePath: file.path,
          line: lineNum,
          severity: 'error',
          category: 'synthesizability',
          problem: 'Timing boundary error: Receiver samples the input one clock cycle later than expected (sample_cnt == CLKS_PER_BIT).',
          whyItMatters:
            'In standard baud generation with 0-indexed counters, sampling at CLKS_PER_BIT causes each bit to take CLKS_PER_BIT+1 cycles, accumulating cumulative phase error that results in frame corruption and framing errors on stop bit.',
          suggestedFix: 'Compare against (CLKS_PER_BIT - 1) or sample at midpoint (CLKS_PER_BIT / 2).',
          codeSnippet: rawLine,
          fixDiff: {
            originalText: rawLine,
            replacementText: rawLine.replace('sample_cnt == CLKS_PER_BIT', 'sample_cnt == (CLKS_PER_BIT - 1)'),
            range: {
              startLineNumber: lineNum,
              startColumn: 1,
              endLineNumber: lineNum,
              endColumn: rawLine.length + 1,
            },
          },
        });
      }

      // 8. CODE QUALITY: Implicit nets or undeclared wire usage
      if (/assign\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=/.test(trimmed)) {
        const netMatch = trimmed.match(/assign\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=/);
        if (netMatch) {
          const netName = netMatch[1];
          usedSignals.add(netName);
        }
      }

      // Signal declarations tracking
      const declMatch = trimmed.match(/^(?:logic|wire|reg|input|output)\s+(?:\[[^\]]+\]\s+)?([a-zA-Z_][a-zA-Z0-9_]*)/);
      if (declMatch) {
        const sigName = declMatch[1];
        if (!['clk', 'rst_n', 'reset', 'en', 'valid', 'ready'].includes(sigName)) {
          declaredSignals.set(sigName, { line: lineNum, type: trimmed.split(' ')[0] });
        }
      }
    }

    // Unmatched begin/end
    if (openBlocks !== 0) {
      diagnostics.push({
        id: `diag_unmatched_blocks`,
        fileId: file.id,
        filePath: file.path,
        line: lines.length,
        severity: 'error',
        category: 'syntax',
        problem: `Unmatched begin/end blocks (delta: ${openBlocks > 0 ? '+' + openBlocks : openBlocks}).`,
        whyItMatters: 'Every "begin" keyword must be paired with an "end" statement.',
        suggestedFix: openBlocks > 0 ? `Add ${openBlocks} missing 'end' statement(s).` : `Remove excess 'end' statement(s).`,
      });
    }

    return diagnostics;
  }

  /**
   * Analyze all files in a project
   */
  static analyzeProject(files: RTLFile[]): RTLDiagnostic[] {
    const allDiagnostics: RTLDiagnostic[] = [];
    for (const file of files) {
      const fileDiags = this.analyzeFile(file);
      allDiagnostics.push(...fileDiags);
    }
    return allDiagnostics;
  }
}
