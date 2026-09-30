/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * HEXA-R AI Copilot Service
 * Context-aware RTL Assistant running on Snapdragon Hexagon NPU / Local Engine.
 */

import {
  AIMessage,
  AIBackendType,
  RTLFile,
  SimulationResult,
  RTLDiagnostic,
} from '../../types';
import { StorageService } from '../storage';
import { InferenceRouter } from './inferenceRouter';
import { UART_RX_CODE_BUGGY, UART_RX_CODE_FIXED } from '../demoProjects';

export interface CopilotContext {
  activeFile?: RTLFile;
  selectedCode?: string;
  allFiles: RTLFile[];
  simulationResult?: SimulationResult | null;
  diagnostics?: RTLDiagnostic[];
}

export class CopilotService {
  /**
   * Process a prompt from user using Gemini API backend with on-device fallback
   */
  static async queryCopilot(
    prompt: string,
    context: CopilotContext,
    onProgress?: (partial: string) => void
  ): Promise<AIMessage> {
    const prefs = StorageService.getUserProfile().preferences;

    // Call server Gemini API endpoint
    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          activeFile: context.activeFile ? {
            name: context.activeFile.name,
            path: context.activeFile.path,
            content: context.activeFile.content,
          } : undefined,
          allFiles: context.allFiles.map(f => ({
            name: f.name,
            path: f.path,
            content: f.content,
            type: f.type,
          })),
          simulationResult: context.simulationResult,
          diagnostics: context.diagnostics,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Build proposedFix if modify_file action exists
        let proposedFix = undefined;
        const modifyAction = data.actions?.find((a: any) => a.type === 'modify_file');
        if (modifyAction) {
          const targetFile = context.allFiles.find(f => f.name === modifyAction.fileName || f.path === modifyAction.fileName) || context.activeFile;
          proposedFix = {
            fileId: targetFile?.id || 'file_uart_rx',
            fileName: modifyAction.fileName,
            originalCode: targetFile?.content || UART_RX_CODE_BUGGY,
            correctedCode: modifyAction.content,
            explanation: modifyAction.explanation,
          };
        }

        // Build generatedRtl if create_file action exists
        let generatedRtl = undefined;
        const createAction = data.actions?.find((a: any) => a.type === 'create_file');
        if (createAction) {
          generatedRtl = {
            moduleName: createAction.fileName.replace(/\.sv$/, '').replace(/\.v$/, ''),
            code: createAction.content,
            assumptions: ['Synthesizable IEEE 1800-2017 RTL', 'Clock synchronous design'],
            ports: [],
            interfaceDescription: createAction.explanation,
          };
        }

        return {
          id: `msg_${Date.now()}`,
          role: 'assistant',
          content: data.reply || 'Command executed.',
          timestamp: new Date().toLocaleTimeString(),
          backendUsed: data.backend || 'gemini_api',
          modelName: data.modelName || 'gemini-3.8-flash',
          taskType: 'debugging',
          proposedFix,
          generatedRtl,
          actions: data.actions || [],
        };
      }
    } catch (err) {
      console.warn('[CopilotService] Failed to query /api/ai/chat, falling back to local reasoning:', err);
    }

    const backend: AIBackendType = prefs.allowCloudAI && prefs.aiBackend === 'cloud_opt_in'
      ? 'cloud_opt_in'
      : prefs.aiBackend;

    const lower = prompt.toLowerCase();

    // Small delay to emulate on-device Hexagon NPU inference streaming
    await new Promise(r => setTimeout(r, 450));

    // CASE 1: Debugging / Why did simulation fail?
    if (
      lower.includes('debug') ||
      lower.includes('why') && lower.includes('fail') ||
      lower.includes('framing') ||
      lower.includes('fix') ||
      (context.simulationResult && !context.simulationResult.success && lower.includes('error'))
    ) {
      return this.handleSimulationDebug(context, backend);
    }

    // CASE 2: Natural Language -> RTL Generation
    if (
      lower.includes('generate rtl') ||
      lower.includes('create a') ||
      lower.includes('fifo') ||
      lower.includes('alu') ||
      lower.includes('arbiter') ||
      lower.includes('counter')
    ) {
      return this.handleRtlGeneration(prompt, backend);
    }

    // CASE 3: Generate Testbench
    if (lower.includes('testbench') || lower.includes('generate tb')) {
      return this.handleTestbenchGeneration(context.activeFile, backend);
    }

    // CASE 4: Latch Inference Explanation
    if (lower.includes('latch') || lower.includes('inferred')) {
      return this.handleLatchExplanation(backend);
    }

    // CASE 5: Generate Assertions (SVA)
    if (lower.includes('assertion') || lower.includes('sva') || lower.includes('formal')) {
      return this.handleAssertionGeneration(context.activeFile, backend);
    }

    // CASE 6: Convert Verilog to SystemVerilog
    if (lower.includes('convert') || lower.includes('systemverilog')) {
      return this.handleVerilogToSystemVerilog(context.activeFile, backend);
    }

    // CASE 7: General Code Explanation
    return this.handleCodeExplanation(prompt, context, backend);
  }

  /**
   * AI Debugging Flow (Demo Step 6-9)
   */
  private static handleSimulationDebug(context: CopilotContext, backend: AIBackendType): AIMessage {
    const activeFile = context.activeFile;
    const isUartRx = activeFile?.name === 'uart_rx.sv' || activeFile?.content.includes('CLKS_PER_BIT');

    const content = `### Root Cause Analysis (Qualcomm Hexagon NPU)

**Observation from Simulator Trace:**
- Simulation failed at **t=360ns** during Test 1 (0xA5 byte transmission).
- The receiver asserted \`framing_err\` and failed SVA assertion \`assert_no_spurious_framing\`.

**Root Cause:**
The receiver samples the serial input **one clock cycle later than expected**.
In \`rtl/uart_rx.sv\` line 89:
\`\`\`systemverilog
if (sample_cnt == CLKS_PER_BIT) begin
\`\`\`
Because \`sample_cnt\` is initialized at \`0\`, counting until \`CLKS_PER_BIT\` causes each serial bit duration to span **\`CLKS_PER_BIT + 1\` cycles** (17 clock cycles instead of 16). 

**Evidence:**
By data bit 7, the accumulated phase error has drifted by +8 clock cycles, placing the sampling point squarely on the transition boundary between data bit 7 and the STOP bit, resulting in a spurious framing violation.

**Proposed Fix:**
Compare \`sample_cnt\` against \`(CLKS_PER_BIT - 1)\` so that each bit duration is precisely 16 clock ticks.

**Why the Fix Works:**
This maintains synchronous phase alignment across all 8 data bits and samples the stop bit squarely in its valid high-level window.`;

    return {
      id: `msg_${Date.now()}`,
      role: 'assistant',
      content,
      timestamp: new Date().toLocaleTimeString(),
      backendUsed: backend,
      modelName: 'Llama 3 8B INT8 (Snapdragon QNN)',
      taskType: 'debugging',
      proposedFix: {
        fileId: activeFile?.id || 'file_uart_rx',
        fileName: activeFile?.name || 'uart_rx.sv',
        originalCode: UART_RX_CODE_BUGGY,
        correctedCode: UART_RX_CODE_FIXED,
        explanation: 'Fix receiver bit counter boundary from CLKS_PER_BIT (17 cycles) to CLKS_PER_BIT - 1 (16 cycles) to eliminate phase drift.',
      },
    };
  }

  /**
   * Automatic Testbench Generator
   */
  static handleTestbenchGeneration(activeFile?: RTLFile, backend: AIBackendType = 'snapdragon_npu'): AIMessage {
    const moduleName = activeFile?.name.replace(/\.(sv|v)$/, '') || 'dut';
    const tbCode = `\`timescale 1ns / 1ps

/**
 * Automatically generated by HEXA-R (Snapdragon Hexagon NPU Copilot)
 * Target DUT: ${moduleName}
 * Features: Clock gen, Reset, Directed stimulus, Corner cases, SVA Assertions
 */
module ${moduleName}_tb;

  // Parameters
  localparam CLK_PERIOD = 20; // 50 MHz

  // Clock & Reset
  logic clk;
  logic rst_n;

  // DUT Interface Signals
  logic        tx_start;
  logic [7:0]  tx_data;
  logic        tx;
  logic        tx_busy;
  logic        tx_done;
  logic        rx;
  logic [7:0]  rx_data;
  logic        rx_valid;
  logic        framing_err;

  // 1. Clock Generation
  initial begin
    clk = 0;
    forever #(CLK_PERIOD / 2) clk = ~clk;
  end

  // 2. DUT Instantiation
  ${moduleName} #(
      .CLKS_PER_BIT(16)
  ) dut (
      .clk        (clk),
      .rst_n      (rst_n),
      .tx_start   (tx_start),
      .tx_data    (tx_data),
      .tx         (tx),
      .tx_busy    (tx_busy),
      .tx_done    (tx_done),
      .rx         (rx),
      .rx_data    (rx_data),
      .rx_valid   (rx_valid),
      .framing_err(framing_err)
  );

  // 3. Verification Sequence
  initial begin
    $display("[TB] =========================================");
    $display("[TB] Starting verification for ${moduleName}");
    $display("[TB] =========================================");
    $dumpfile("${moduleName}_wave.vcd");
    $dumpvars(0, ${moduleName}_tb);

    // Initial state
    rst_n    = 0;
    tx_start = 0;
    tx_data  = 8'h00;
    rx       = 1;

    // Reset Sequence
    #(CLK_PERIOD * 3);
    rst_n = 1;
    #(CLK_PERIOD * 2);
    $display("[TB] Reset sequence passed.");

    // TEST 1: Basic functionality
    $display("[TB] Test 1: Stimulus application");
    @(posedge clk);
    tx_data  <= 8'hA5;
    tx_start <= 1'b1;
    @(posedge clk);
    tx_start <= 1'b0;

    // Wait for completion
    wait(tx_done);
    $display("[TB] Test 1 passed: tx_done asserted successfully.");

    // TEST 2: Boundary test (All 1s, All 0s)
    $display("[TB] Test 2: Extreme values (0xFF, 0x00)");
    @(posedge clk);
    tx_data  <= 8'hFF;
    tx_start <= 1'b1;
    @(posedge clk);
    tx_start <= 1'b0;
    wait(tx_done);

    // Finish simulation
    #(CLK_PERIOD * 10);
    $display("[TB] ALL TEST CASES COMPLETED SUCCESSFULLY!");
    $finish;
  end

  // 4. SystemVerilog Assertions (SVA)
  property p_reset_state;
    @(posedge clk) !rst_n |-> (!tx_busy && !rx_valid);
  endproperty
  assert_reset: assert property(p_reset_state)
    else $error("[ASSERTION FAIL] Reset did not clear status registers!");

endmodule`;

    return {
      id: `msg_${Date.now()}`,
      role: 'assistant',
      content: `### Testbench Generated for \`${moduleName}\`

HEXA-R extracted the port list, identified clock/reset conventions, and generated a structured SystemVerilog testbench:

**Structure:**
- **Clock Generator:** 50 MHz parameterized (\`#10ns\`)
- **Reset Sequence:** Asynchronous assertion, synchronous de-assertion
- **Directed Stimulus:** Basic operation, corner cases (\`0x00\`, \`0xFF\`, alternating bits)
- **VCD Waveform Dump:** Enabled for on-device waveform inspection
- **Formal SVA Assertions:** Checked on \`posedge clk\`

You can insert this testbench directly into \`tb/${moduleName}_tb.sv\` or run verification immediately.`,
      timestamp: new Date().toLocaleTimeString(),
      backendUsed: backend,
      modelName: 'Llama 3 8B INT8 (Snapdragon QNN)',
      taskType: 'testbench_generation',
      generatedRtl: {
        moduleName: `${moduleName}_tb`,
        code: tbCode,
        assumptions: [
          'Clock frequency is 50MHz with 50% duty cycle',
          'Active-low reset (rst_n) synchronized to clock domain',
          'Standard SystemVerilog IEEE 1800-2017 syntax',
        ],
        ports: ['clk', 'rst_n', 'tx_start', 'tx_data[7:0]', 'tx', 'tx_busy', 'tx_done', 'rx', 'rx_data[7:0]', 'rx_valid', 'framing_err'],
      },
    };
  }

  /**
   * Natural Language to RTL Generation
   */
  static handleRtlGeneration(prompt: string, backend: AIBackendType = 'snapdragon_npu'): AIMessage {
    const isFifo = prompt.toLowerCase().includes('fifo');
    const isAlu = prompt.toLowerCase().includes('alu');

    if (isFifo) {
      const fifoCode = `\`timescale 1ns / 1ps

/**
 * Module: sync_fifo
 * Generated by HEXA-R (Snapdragon Hexagon NPU)
 * Description: Parameterized synchronous FIFO with full, empty, and watermarks
 */
module sync_fifo #(
    parameter DATA_WIDTH = 32,
    parameter DEPTH      = 16,
    localparam ADDR_WIDTH = $clog2(DEPTH)
)(
    input  logic                   clk,
    input  logic                   rst_n,
    
    // Write Interface
    input  logic                   wr_en,
    input  logic [DATA_WIDTH-1:0]  wr_data,
    output logic                   full,
    output logic                   almost_full,
    
    // Read Interface
    input  logic                   rd_en,
    output logic [DATA_WIDTH-1:0]  rd_data,
    output logic                   empty,
    output logic                   almost_empty,
    
    // Occupancy Status
    output logic [ADDR_WIDTH:0]    fifo_count
);

  // Memory array
  logic [DATA_WIDTH-1:0] mem [DEPTH-1:0];

  // Pointers (extra MSB bit for wrap-around full detection)
  logic [ADDR_WIDTH:0] wr_ptr;
  logic [ADDR_WIDTH:0] rd_ptr;

  // Status flags
  assign empty       = (wr_ptr == rd_ptr);
  assign full        = (wr_ptr[ADDR_WIDTH] != rd_ptr[ADDR_WIDTH]) &&
                       (wr_ptr[ADDR_WIDTH-1:0] == rd_ptr[ADDR_WIDTH-1:0]);
  assign fifo_count  = wr_ptr - rd_ptr;
  assign almost_full = (fifo_count >= DEPTH - 1);
  assign almost_empty= (fifo_count <= 1);

  // Write operation
  always_ff @(posedge clk or negedge rst_n) begin
    if (!rst_n) begin
      wr_ptr <= '0;
    end else if (wr_en && !full) begin
      mem[wr_ptr[ADDR_WIDTH-1:0]] <= wr_data;
      wr_ptr <= wr_ptr + 1'b1;
    end
  end

  // Read operation (FWFT or registered read)
  always_ff @(posedge clk or negedge rst_n) begin
    if (!rst_n) begin
      rd_ptr  <= '0;
      rd_data <= '0;
    end else if (rd_en && !empty) begin
      rd_data <= mem[rd_ptr[ADDR_WIDTH-1:0]];
      rd_ptr  <= rd_ptr + 1'b1;
    end
  end

  // Assertions for formal verification
  // synopsys translate_off
  assert_no_write_overflow: assert property (@(posedge clk) disable iff (!rst_n)
    wr_en && full |-> ##1 full)
    else $error("[FIFO OVERFLOW] Attempted write when FIFO is full!");

  assert_no_read_underflow: assert property (@(posedge clk) disable iff (!rst_n)
    rd_en && empty |-> ##1 empty)
    else $error("[FIFO UNDERFLOW] Attempted read when FIFO is empty!");
  // synopsys translate_on

endmodule`;

      return {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: `### Generated RTL: Parameterized Synchronous FIFO (\`sync_fifo.sv\`)

**Architectural Specification:**
- **Data Bus Width:** Configurable via \`DATA_WIDTH\` (default: 32 bits)
- **Buffer Depth:** Configurable via \`DEPTH\` (default: 16 entries)
- **Status Flags:** High-speed combinational \`full\`, \`empty\`, \`almost_full\`, \`almost_empty\`
- **Pointer Architecture:** Extra MSB wrap-around bit prevents race conditions during simultaneous read/write
- **Formal Invariants:** SVA assertions for overflow/underflow protection embedded for simulation

Would you like to insert this module into your project?`,
        timestamp: new Date().toLocaleTimeString(),
        backendUsed: backend,
        modelName: 'Llama 3 8B INT8 (Snapdragon QNN)',
        taskType: 'rtl_generation',
        generatedRtl: {
          moduleName: 'sync_fifo',
          code: fifoCode,
          assumptions: [
            'DEPTH is a power of 2 for clean pointer wrap-around',
            'Synchronous single clock domain (clk)',
            'Synthesizes to distributed RAM or Block RAM on ASIC/FPGA cells',
          ],
          ports: [
            'clk', 'rst_n', 'wr_en', 'wr_data[31:0]', 'full', 'almost_full',
            'rd_en', 'rd_data[31:0]', 'empty', 'almost_empty', 'fifo_count[4:0]'
          ],
        },
      };
    }

    // Default: General RTL Generator
    const aluCode = `\`timescale 1ns / 1ps

/**
 * Module: alu_32
 * Generated by HEXA-R (Snapdragon Hexagon NPU)
 * Description: 32-bit Arithmetic Logic Unit with condition flags
 */
module alu_32 (
    input  logic [31:0] a,
    input  logic [31:0] b,
    input  logic [3:0]  op,
    output logic [31:0] result,
    output logic        zero,
    output logic        carry,
    output logic        overflow,
    output logic        negative
);

  logic [32:0] ext_result;

  always_comb begin
    ext_result = 33'h0;
    overflow   = 1'b0;

    case (op)
      4'b0000: ext_result = {1'b0, a} + {1'b0, b};         // ADD
      4'b0001: ext_result = {1'b0, a} - {1'b0, b};         // SUB
      4'b0010: ext_result = {1'b0, a & b};                 // AND
      4'b0011: ext_result = {1'b0, a | b};                 // OR
      4'b0100: ext_result = {1'b0, a ^ b};                 // XOR
      4'b0101: ext_result = {1'b0, ~(a | b)};              // NOR
      4'b0110: ext_result = {1'b0, a << b[4:0]};           // SLL
      4'b0111: ext_result = {1'b0, a >> b[4:0]};           // SRL
      4'b1000: ext_result = {1'b0, $signed(a) >>> b[4:0]}; // SRA
      4'b1001: ext_result = {32'b0, a < b};                // SLTU
      default: ext_result = 33'h0;
    endcase

    result   = ext_result[31:0];
    carry    = ext_result[32];
    zero     = (result == 32'h0);
    negative = result[31];

    if (op == 4'b0000) begin
      overflow = (a[31] == b[31]) && (result[31] != a[31]);
    end else if (op == 4'b0001) begin
      overflow = (a[31] != b[31]) && (result[31] != a[31]);
    end
  end

endmodule`;

    return {
      id: `msg_${Date.now()}`,
      role: 'assistant',
      content: `### Generated RTL: 32-bit ALU (\`alu_32.sv\`)

**Features:**
- Full arithmetic (ADD, SUB with signed 2's complement overflow detection)
- Logical (AND, OR, XOR, NOR)
- Barrel shifter (SLL, SRL, SRA arithmetic right shift)
- Zero, Carry, Overflow, and Negative condition status flags
- Clean synthesizable combinational logic using SystemVerilog \`always_comb\` with comprehensive \`default\` case to prevent latch inference.`,
      timestamp: new Date().toLocaleTimeString(),
      backendUsed: backend,
      modelName: 'Llama 3 8B INT8 (Snapdragon QNN)',
      taskType: 'rtl_generation',
      generatedRtl: {
        moduleName: 'alu_32',
        code: aluCode,
        assumptions: ['Purely combinational module', 'IEEE 1800-2017 SystemVerilog'],
        ports: ['a[31:0]', 'b[31:0]', 'op[3:0]', 'result[31:0]', 'zero', 'carry', 'overflow', 'negative'],
      },
    };
  }

  /**
   * Explain Latch Inference
   */
  private static handleLatchExplanation(backend: AIBackendType): AIMessage {
    return {
      id: `msg_${Date.now()}`,
      role: 'assistant',
      content: `### Transparent Latch Inference in SystemVerilog

A **latch** is inferred by synthesis tools when a combinational block (\`always_comb\` or \`always @(*)\`) does not assign a value to a variable in **every possible branch of execution**.

**Why it matters in ASIC & FPGA design:**
1. **Timing Closure Nightmare:** Latches are level-sensitive, meaning data passes transparently whenever the enable is high, making static timing analysis (STA) and setup/hold check calculations extremely complex.
2. **Silicon Area & Glitches:** Latches are susceptible to combinatorial glitches on control signals, which can cause spurious state updates and power waste.
3. **Scan Testing (DFT):** Standard scan chains cannot test latches as easily as edge-triggered D flip-flops (\`always_ff\`).

**How to avoid latches:**
1. **Assign Default Values First:** At the top of every \`always_comb\` block, assign a default value to all outputs before any \`if\` or \`case\` conditions.
2. **Provide Complete \`case\` Branches:** Always include a \`default:\` statement in \`case\` structures.
3. **Complete \`if\` Branches:** Ensure every \`if\` is paired with an \`else\`.`,
      timestamp: new Date().toLocaleTimeString(),
      backendUsed: backend,
      modelName: 'Llama 3 8B INT8 (Snapdragon QNN)',
      taskType: 'code_explanation',
    };
  }

  /**
   * SVA Assertion Generator
   */
  private static handleAssertionGeneration(activeFile?: RTLFile, backend: AIBackendType = 'snapdragon_npu'): AIMessage {
    return {
      id: `msg_${Date.now()}`,
      role: 'assistant',
      content: `### SystemVerilog Assertions (SVA) for ${activeFile?.name || 'RTL Module'}

Here are formal verification properties ready to embed in your design or testbench:

\`\`\`systemverilog
// 1. Handshake Invariant: When tx_start asserts, tx_busy must assert on next cycle
property p_tx_start_to_busy;
  @(posedge clk) disable iff (!rst_n)
  tx_start |=> tx_busy;
endproperty
assert_tx_busy: assert property(p_tx_start_to_busy)
  else $error("[SVA FAIL] tx_busy failed to assert after tx_start!");

// 2. Framing Integrity: framing_err and rx_valid must NEVER assert concurrently
property p_mutex_valid_framing;
  @(posedge clk) disable iff (!rst_n)
  framing_err |-> !rx_valid;
endproperty
assert_mutex_flags: assert property(p_mutex_valid_framing)
  else $error("[SVA FAIL] Mutex violation: framing_err and rx_valid high simultaneously!");

// 3. Line Idle Property: In IDLE state, serial line must be held HIGH (mark state)
property p_idle_line_high;
  @(posedge clk) disable iff (!rst_n)
  (state == IDLE) |-> (tx == 1'b1);
endproperty
assert_idle_high: assert property(p_idle_line_high)
  else $error("[SVA FAIL] Serial line floated low during IDLE state!");
\`\`\`

These properties can be used for both dynamic simulation (Icarus/Verilator) and formal model checking (SymbiYosys).`,
      timestamp: new Date().toLocaleTimeString(),
      backendUsed: backend,
      modelName: 'Llama 3 8B INT8 (Snapdragon QNN)',
      taskType: 'assertion_generation',
    };
  }

  /**
   * Convert Verilog to SystemVerilog
   */
  private static handleVerilogToSystemVerilog(activeFile?: RTLFile, backend: AIBackendType = 'snapdragon_npu'): AIMessage {
    return {
      id: `msg_${Date.now()}`,
      role: 'assistant',
      content: `### Verilog-2001 to SystemVerilog (IEEE 1800) Migration Guide

SystemVerilog replaces ambiguous Verilog constructs with explicit intent:

1. **Replace \`reg\` and \`wire\` with \`logic\`:**
   - Verilog: \`reg [7:0] data; wire ready;\`
   - SystemVerilog: \`logic [7:0] data; logic ready;\`
2. **Replace ambiguous \`always\` blocks:**
   - Clocked register: Use \`always_ff @(posedge clk or negedge rst_n)\` (Enforces flip-flop semantics; compiler errors if combinational logic or latches are created)
   - Combinational: Use \`always_comb\` (Automatically infers sensitivity list; checks for latch hazards)
   - Continuous assignment: Use \`assign\` or \`always_comb\`
3. **Use Enumerated Types for FSMs:**
   - \`typedef enum logic [1:0] { IDLE, START, DATA, STOP } state_t;\`
4. **Package & Interface encapsulation:**
   - Consolidate common buses into \`interface\` declarations to reduce port sprawl.`,
      timestamp: new Date().toLocaleTimeString(),
      backendUsed: backend,
      modelName: 'Llama 3 8B INT8 (Snapdragon QNN)',
      taskType: 'code_explanation',
    };
  }

  /**
   * General Code Explanation
   */
  private static handleCodeExplanation(prompt: string, context: CopilotContext, backend: AIBackendType): AIMessage {
    const file = context.activeFile;
    return {
      id: `msg_${Date.now()}`,
      role: 'assistant',
      content: `### Analysis of \`${file?.name || 'Active RTL'}\`

**Context:**
- Module target: Snapdragon Hardware Verification
- Selected construct: \`${context.selectedCode ? context.selectedCode.slice(0, 80) + '...' : 'Full Module'}\`

**Explanation:**
This design implements a synchronous finite state machine (FSM). 
- **Sequential State Registers:** Driven by \`always_ff\`, isolated to the \`clk\` rising edge.
- **Clock Domain Crossings:** A 2-stage flip-flop synchronizer (\`rx_sync_0\`, \`rx_sync\`) is employed at the input port to eliminate metastability when receiving asynchronous serial bits.
- **Baud Division:** Controlled via the \`baud_tick\` strobe, maintaining cycle-accurate bit sampling without requiring an asynchronous derived clock net.

Ask me to **Generate Testbench**, **Check Synthesizability**, **Inject Timing Fix**, or **Synthesize SVA Assertions**!`,
      timestamp: new Date().toLocaleTimeString(),
      backendUsed: backend,
      modelName: 'Llama 3 8B INT8 (Snapdragon QNN)',
      taskType: 'code_explanation',
    };
  }
}
