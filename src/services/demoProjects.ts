/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * HEXA-R Pre-packaged Demo Projects
 * Includes UART Controller with intentional bug for the demo workflow
 */

import { Project, RTLFile, ProjectFolder } from '../types';

export const BUGGY_UART_RX_SNIPPET = `        // Intentional timing mismatch in demo state:
        // Delaying bit sampling by 1 additional cycle causes baud framing error
        if (baud_tick) begin
          if (sample_cnt == CLKS_PER_BIT) begin // BUG: should be CLKS_PER_BIT-1 or sampled at midpoint
            rx_data_reg[bit_idx] <= rx_sync;
            bit_idx <= bit_idx + 1;
            sample_cnt <= 0;
          end else begin
            sample_cnt <= sample_cnt + 1;
          end
        end`;

export const FIXED_UART_RX_SNIPPET = `        // Corrected bit sampling: sample at midpoint of baud period (CLKS_PER_BIT/2)
        if (baud_tick) begin
          if (sample_cnt == (CLKS_PER_BIT - 1)) begin
            rx_data_reg[bit_idx] <= rx_sync;
            bit_idx <= bit_idx + 1;
            sample_cnt <= 0;
          end else begin
            sample_cnt <= sample_cnt + 1;
          end
        end`;

export const UART_RX_CODE_BUGGY = `/**
 * Module: uart_rx
 * Project: UART Controller
 * Description: UART Receiver with 8-N-1 format (8 data bits, no parity, 1 stop bit)
 * Target: Snapdragon FPGA/ASIC Prototyping
 */

\`timescale 1ns / 1ps

module uart_rx #(
    parameter CLKS_PER_BIT = 16
)(
    input  logic        clk,
    input  logic        rst_n,
    input  logic        rx,
    input  logic        baud_tick,
    output logic [7:0]  rx_data,
    output logic        rx_valid,
    output logic        framing_err
);

  typedef enum logic [1:0] {
    IDLE  = 2'b00,
    START = 2'b01,
    DATA  = 2'b10,
    STOP  = 2'b11
  } state_t;

  state_t state, next_state;
  logic [7:0] rx_data_reg;
  logic [2:0] bit_idx;
  logic [7:0] sample_cnt;
  logic rx_sync_0, rx_sync;

  // 2FF synchronizer to eliminate metastability
  always_ff @(posedge clk or negedge rst_n) begin
    if (!rst_n) begin
      rx_sync_0 <= 1'b1;
      rx_sync   <= 1'b1;
    end else begin
      rx_sync_0 <= rx;
      rx_sync   <= rx_sync_0;
    end
  end

  // Sequential state machine
  always_ff @(posedge clk or negedge rst_n) begin
    if (!rst_n) begin
      state       <= IDLE;
      rx_data_reg <= 8'h00;
      bit_idx     <= 3'b000;
      sample_cnt  <= 8'h00;
      rx_valid    <= 1'b0;
      framing_err <= 1'b0;
    end else begin
      rx_valid    <= 1'b0;
      framing_err <= 1'b0;

      case (state)
        IDLE: begin
          sample_cnt <= 8'h00;
          bit_idx    <= 3'b000;
          if (!rx_sync) begin // Start bit detected (low)
            state <= START;
          end
        end

        START: begin
          if (baud_tick) begin
            if (sample_cnt == (CLKS_PER_BIT / 2)) begin
              if (!rx_sync) begin
                sample_cnt <= 8'h00;
                state      <= DATA;
              end else begin
                state <= IDLE; // False start glitch
              end
            end else begin
              sample_cnt <= sample_cnt + 1;
            end
          end
        end

        DATA: begin
          // BUGGY SAMPLING LOGIC:
          // The receiver samples the input one clock cycle later than expected (sample_cnt == CLKS_PER_BIT)
          // which causes framing boundary shift on subsequent bits!
          if (baud_tick) begin
            if (sample_cnt == CLKS_PER_BIT) begin
              rx_data_reg[bit_idx] <= rx_sync;
              sample_cnt <= 8'h00;
              if (bit_idx == 3'd7) begin
                state <= STOP;
              end else begin
                bit_idx <= bit_idx + 1;
              end
            end else begin
              sample_cnt <= sample_cnt + 1;
            end
          end
        end

        STOP: begin
          if (baud_tick) begin
            if (sample_cnt == (CLKS_PER_BIT - 1)) begin
              if (rx_sync == 1'b1) begin
                rx_data  <= rx_data_reg;
                rx_valid <= 1'b1;
              end else begin
                framing_err <= 1'b1;
              end
              state <= IDLE;
            end else begin
              sample_cnt <= sample_cnt + 1;
            end
          end
        end

        default: state <= IDLE;
      endcase
    end
  end

endmodule
`;

export const UART_RX_CODE_FIXED = `/**
 * Module: uart_rx
 * Project: UART Controller
 * Description: UART Receiver with 8-N-1 format (8 data bits, no parity, 1 stop bit)
 * Target: Snapdragon FPGA/ASIC Prototyping
 */

\`timescale 1ns / 1ps

module uart_rx #(
    parameter CLKS_PER_BIT = 16
)(
    input  logic        clk,
    input  logic        rst_n,
    input  logic        rx,
    input  logic        baud_tick,
    output logic [7:0]  rx_data,
    output logic        rx_valid,
    output logic        framing_err
);

  typedef enum logic [1:0] {
    IDLE  = 2'b00,
    START = 2'b01,
    DATA  = 2'b10,
    STOP  = 2'b11
  } state_t;

  state_t state, next_state;
  logic [7:0] rx_data_reg;
  logic [2:0] bit_idx;
  logic [7:0] sample_cnt;
  logic rx_sync_0, rx_sync;

  // 2FF synchronizer to eliminate metastability
  always_ff @(posedge clk or negedge rst_n) begin
    if (!rst_n) begin
      rx_sync_0 <= 1'b1;
      rx_sync   <= 1'b1;
    end else begin
      rx_sync_0 <= rx;
      rx_sync   <= rx_sync_0;
    end
  end

  // Sequential state machine
  always_ff @(posedge clk or negedge rst_n) begin
    if (!rst_n) begin
      state       <= IDLE;
      rx_data_reg <= 8'h00;
      bit_idx     <= 3'b000;
      sample_cnt  <= 8'h00;
      rx_valid    <= 1'b0;
      framing_err <= 1'b0;
    end else begin
      rx_valid    <= 1'b0;
      framing_err <= 1'b0;

      case (state)
        IDLE: begin
          sample_cnt <= 8'h00;
          bit_idx    <= 3'b000;
          if (!rx_sync) begin // Start bit detected (low)
            state <= START;
          end
        end

        START: begin
          if (baud_tick) begin
            if (sample_cnt == (CLKS_PER_BIT / 2)) begin
              if (!rx_sync) begin
                sample_cnt <= 8'h00;
                state      <= DATA;
              end else begin
                state <= IDLE; // False start glitch
              end
            end else begin
              sample_cnt <= sample_cnt + 1;
            end
          end
        end

        DATA: begin
          // FIXED: Sample bit precisely at baud boundary CLKS_PER_BIT - 1
          if (baud_tick) begin
            if (sample_cnt == (CLKS_PER_BIT - 1)) begin
              rx_data_reg[bit_idx] <= rx_sync;
              sample_cnt <= 8'h00;
              if (bit_idx == 3'd7) begin
                state <= STOP;
              end else begin
                bit_idx <= bit_idx + 1;
              end
            end else begin
              sample_cnt <= sample_cnt + 1;
            end
          end
        end

        STOP: begin
          if (baud_tick) begin
            if (sample_cnt == (CLKS_PER_BIT - 1)) begin
              if (rx_sync == 1'b1) begin
                rx_data  <= rx_data_reg;
                rx_valid <= 1'b1;
              end else begin
                framing_err <= 1'b1;
              end
              state <= IDLE;
            end else begin
              sample_cnt <= sample_cnt + 1;
            end
          end
        end

        default: state <= IDLE;
      endcase
    end
  end

endmodule
`;

export const UART_TX_CODE = `/**
 * Module: uart_tx
 * Project: UART Controller
 * Description: Parameterized UART Transmitter with busy and done signals
 */

\`timescale 1ns / 1ps

module uart_tx #(
    parameter CLKS_PER_BIT = 16
)(
    input  logic        clk,
    input  logic        rst_n,
    input  logic        tx_start,
    input  logic [7:0]  tx_data,
    input  logic        baud_tick,
    output logic        tx,
    output logic        tx_busy,
    output logic        tx_done
);

  typedef enum logic [1:0] {
    IDLE  = 2'b00,
    START = 2'b01,
    DATA  = 2'b10,
    STOP  = 2'b11
  } state_t;

  state_t state;
  logic [7:0] data_reg;
  logic [2:0] bit_idx;
  logic [7:0] clk_cnt;

  always_ff @(posedge clk or negedge rst_n) begin
    if (!rst_n) begin
      state    <= IDLE;
      tx       <= 1'b1; // Idle high
      tx_busy  <= 1'b0;
      tx_done  <= 1'b0;
      bit_idx  <= 3'b000;
      clk_cnt  <= 8'h00;
      data_reg <= 8'h00;
    end else begin
      tx_done <= 1'b0;

      case (state)
        IDLE: begin
          tx      <= 1'b1;
          tx_busy <= 1'b0;
          clk_cnt <= 8'h00;
          bit_idx <= 3'b000;
          if (tx_start) begin
            data_reg <= tx_data;
            tx_busy  <= 1'b1;
            state    <= START;
          end
        end

        START: begin
          tx <= 1'b0; // Start bit
          if (baud_tick) begin
            if (clk_cnt == (CLKS_PER_BIT - 1)) begin
              clk_cnt <= 8'h00;
              state   <= DATA;
            end else begin
              clk_cnt <= clk_cnt + 1;
            end
          end
        end

        DATA: begin
          tx <= data_reg[bit_idx];
          if (baud_tick) begin
            if (clk_cnt == (CLKS_PER_BIT - 1)) begin
              clk_cnt <= 8'h00;
              if (bit_idx == 3'd7) begin
                state <= STOP;
              end else begin
                bit_idx <= bit_idx + 1;
              end
            end else begin
              clk_cnt <= clk_cnt + 1;
            end
          end
        end

        STOP: begin
          tx <= 1'b1; // Stop bit
          if (baud_tick) begin
            if (clk_cnt == (CLKS_PER_BIT - 1)) begin
              tx_done <= 1'b1;
              tx_busy <= 1'b0;
              state   <= IDLE;
            end else begin
              clk_cnt <= clk_cnt + 1;
            end
          end
        end

        default: state <= IDLE;
      endcase
    end
  end

endmodule
`;

export const UART_TOP_CODE = `/**
 * Module: uart_top
 * Project: UART Controller
 * Description: Full Duplex UART Top with Baud Rate Generator
 */

\`timescale 1ns / 1ps

module uart_top #(
    parameter CLK_FREQ_HZ = 50_000_000,
    parameter BAUD_RATE   = 115200
)(
    input  logic       clk,
    input  logic       rst_n,
    // TX Interface
    input  logic       tx_start,
    input  logic [7:0] tx_data,
    output logic       tx,
    output logic       tx_busy,
    output logic       tx_done,
    // RX Interface
    input  logic       rx,
    output logic [7:0] rx_data,
    output logic       rx_valid,
    output logic       framing_err
);

  localparam CLKS_PER_BIT = CLK_FREQ_HZ / BAUD_RATE; // e.g. 434
  logic baud_tick;

  // Baud rate generator tick
  always_comb begin
    baud_tick = 1'b1; // Simulation standard tick
  end

  // Transmitter Instance
  uart_tx #(
      .CLKS_PER_BIT(16)
  ) u_tx (
      .clk       (clk),
      .rst_n     (rst_n),
      .tx_start  (tx_start),
      .tx_data   (tx_data),
      .baud_tick (baud_tick),
      .tx        (tx),
      .tx_busy   (tx_busy),
      .tx_done   (tx_done)
  );

  // Receiver Instance
  uart_rx #(
      .CLKS_PER_BIT(16)
  ) u_rx (
      .clk         (clk),
      .rst_n       (rst_n),
      .rx          (rx),
      .baud_tick   (baud_tick),
      .rx_data     (rx_data),
      .rx_valid    (rx_valid),
      .framing_err (framing_err)
  );

endmodule
`;

export const UART_TB_CODE = `/**
 * Testbench: uart_tb
 * Project: UART Controller
 * Verifies: Loopback transmission, baud timing, framing, byte verification
 */

\`timescale 1ns / 1ps

module uart_tb;

  logic clk;
  logic rst_n;
  logic tx_start;
  logic [7:0] tx_data;
  logic tx;
  logic tx_busy;
  logic tx_done;
  logic [7:0] rx_data;
  logic rx_valid;
  logic framing_err;

  // Clock generation: 50 MHz (20ns period)
  initial begin
    clk = 0;
    forever #10 clk = ~clk;
  end

  // DUT Instance
  uart_top dut (
      .clk        (clk),
      .rst_n      (rst_n),
      .tx_start   (tx_start),
      .tx_data    (tx_data),
      .tx         (tx),
      .tx_busy    (tx_busy),
      .tx_done    (tx_done),
      .rx         (tx), // Loopback TX -> RX
      .rx_data    (rx_data),
      .rx_valid   (rx_valid),
      .framing_err(framing_err)
  );

  // Verification Sequence
  initial begin
    $display("[TB] Starting UART Controller Verification Suite...");
    $dumpfile("uart_sim.vcd");
    $dumpvars(0, uart_tb);

    rst_n    = 0;
    tx_start = 0;
    tx_data  = 8'h00;

    // Reset sequence
    #40;
    rst_n = 1;
    #40;
    $display("[TB] Reset sequence completed.");

    // TEST 1: Transmit byte 0xA5 (10100101)
    $display("[TB] RUNNING TEST 1: Transmit 0xA5 loopback test");
    @(posedge clk);
    tx_data  <= 8'hA5;
    tx_start <= 1;
    @(posedge clk);
    tx_start <= 0;

    // Wait for RX valid
    @(posedge rx_valid or posedge framing_err);
    if (framing_err) begin
      $display("[FAIL] Framing error detected on Test 1! Receiver sampled input out-of-sync.");
    end else if (rx_data === 8'hA5) begin
      $display("[PASS] Test 1: Received 0x%02X matches expected 0xA5", rx_data);
    end else begin
      $display("[FAIL] Test 1: Received 0x%02X does NOT match expected 0xA5", rx_data);
    end

    // TEST 2: Transmit byte 0x3C
    #100;
    $display("[TB] RUNNING TEST 2: Transmit 0x3C boundary test");
    @(posedge clk);
    tx_data  <= 8'h3C;
    tx_start <= 1;
    @(posedge clk);
    tx_start <= 0;

    @(posedge rx_valid or posedge framing_err);
    if (!framing_err && rx_data === 8'h3C) begin
      $display("[PASS] Test 2: Received 0x%02X matches expected 0x3C", rx_data);
    end else begin
      $display("[FAIL] Test 2: Mismatch or framing error. rx_data=0x%02X", rx_data);
    end

    #200;
    $display("[TB] Verification run finished.");
    $finish;
  end

  // Assertions
  assert_no_spurious_framing: assert property (@(posedge clk) disable iff (!rst_n)
    framing_err |-> !rx_valid)
    else $error("[ASSERTION FAIL] Framing error asserted concurrently with rx_valid!");

endmodule
`;

export const UART_README = `# UART Controller (8-N-1)

Private On-Device RTL Project optimized for Snapdragon Hexagon NPU Copilot (HEXA-R).

## Directory Structure
- \`rtl/uart_tx.sv\` : Transmitter module with configurable baud rate counter
- \`rtl/uart_rx.sv\` : Receiver module with 2-FF metastability protection
- \`rtl/uart_top.sv\`: Top-level wrapper with internal loopback & baud generator
- \`tb/uart_tb.sv\`  : SystemVerilog verification testbench with assertions
- \`reports/\`       : Static analysis and simulation diagnostic reports

## Features
- Full duplex asynchronous serial transceiver
- Parameterized baud rate clock divider
- Synthesizable for Snapdragon ASIC/FPGA target architectures
- Zero cloud transmission: completely simulated and verified locally on-device
`;

export function createUartDemoProject(): Project {
  const rxFile: RTLFile = {
    id: 'file_uart_rx',
    name: 'uart_rx.sv',
    path: 'rtl/uart_rx.sv',
    content: UART_RX_CODE_BUGGY,
    type: 'systemverilog',
    isModified: false,
  };

  const txFile: RTLFile = {
    id: 'file_uart_tx',
    name: 'uart_tx.sv',
    path: 'rtl/uart_tx.sv',
    content: UART_TX_CODE,
    type: 'systemverilog',
    isModified: false,
  };

  const topFile: RTLFile = {
    id: 'file_uart_top',
    name: 'uart_top.sv',
    path: 'rtl/uart_top.sv',
    content: UART_TOP_CODE,
    type: 'systemverilog',
    isTopModule: true,
    isModified: false,
  };

  const tbFile: RTLFile = {
    id: 'file_uart_tb',
    name: 'uart_tb.sv',
    path: 'tb/uart_tb.sv',
    content: UART_TB_CODE,
    type: 'testbench',
    isTestbench: true,
    isModified: false,
  };

  const readmeFile: RTLFile = {
    id: 'file_readme',
    name: 'README.md',
    path: 'README.md',
    content: UART_README,
    type: 'markdown',
    readOnly: true,
  };

  const rtlFolder: ProjectFolder = {
    id: 'folder_rtl',
    name: 'rtl',
    path: 'rtl',
    files: [rxFile, txFile, topFile],
  };

  const tbFolder: ProjectFolder = {
    id: 'folder_tb',
    name: 'tb',
    path: 'tb',
    files: [tbFile],
  };

  const rootFolder: ProjectFolder = {
    id: 'folder_root',
    name: 'uart_controller',
    path: '',
    files: [readmeFile],
    subFolders: [rtlFolder, tbFolder],
  };

  return {
    metadata: {
      id: 'proj_uart_controller',
      name: 'UART Controller',
      description: 'Full-duplex 8-N-1 UART Transceiver with parameterized baud clocking and assertions',
      topModule: 'uart_top',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      targetDevice: 'Snapdragon X Elite / Hexagon NPU',
      filesCount: 4,
      testbenchCount: 1,
      testsCount: 48,
      passingTests: 43,
      failingTests: 5,
      synthesizabilityScore: 92,
    },
    rootFolders: [rootFolder],
    activeFileId: 'file_uart_rx',
    openFileIds: ['file_uart_rx', 'file_uart_tx', 'file_uart_tb'],
  };
}
