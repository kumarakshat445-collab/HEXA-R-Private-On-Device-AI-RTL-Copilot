/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * HEXA-R System Tools Detector
 * Inspects host system for Verilator, Icarus Verilog, Yosys, and Qualcomm QNN tools.
 * Never fakes tool availability: if missing, reports clearly with exact install commands.
 */

import { DetectedTools } from '../types';

export class SystemToolsDetector {
  /**
   * Detect installed host EDA and AI tools
   */
  static async detectTools(): Promise<DetectedTools> {
    // In browser/web container context, check local environment or backend probe
    let hostIverilog = false;
    let hostVerilator = false;
    let hostYosys = false;
    let hostQNN = false;

    try {
      const res = await fetch('/api/system/tools', { method: 'GET' });
      if (res.ok) {
        const data = await res.json();
        return data;
      }
    } catch {
      // Backend not running or static client environment
    }

    // Return detected status
    return {
      iverilog: {
        installed: hostIverilog,
        version: hostIverilog ? '12.0' : undefined,
        path: hostIverilog ? '/usr/bin/iverilog' : undefined,
      },
      verilator: {
        installed: hostVerilator,
        version: hostVerilator ? '5.020' : undefined,
        path: hostVerilator ? '/usr/bin/verilator' : undefined,
      },
      yosys: {
        installed: hostYosys,
        version: hostYosys ? '0.38' : undefined,
        path: hostYosys ? '/usr/bin/yosys' : undefined,
      },
      snapdragonQNN: {
        installed: hostQNN,
        version: hostQNN ? '2.20 (Hexagon v73)' : undefined,
        path: hostQNN ? '/opt/qcom/qnn' : undefined,
      },
      inMemorySimulator: {
        installed: true,
        version: 'HEXA-R Cycle-Accurate In-Memory Engine v2.4 (Active)',
      },
    };
  }

  /**
   * Instructions for installing missing EDA tools on Snapdragon Windows / Linux
   */
  static getInstallationInstructions(tool: 'verilator' | 'iverilog' | 'yosys' | 'qnn'): {
    title: string;
    linux: string;
    windows: string;
    macos: string;
    docsUrl: string;
  } {
    switch (tool) {
      case 'verilator':
        return {
          title: 'Verilator SystemVerilog Simulator',
          linux: 'sudo apt update && sudo apt install verilator',
          windows: 'winget install verilator --source winget  # or MSYS2: pacman -S mingw-w64-x86_64-verilator',
          macos: 'brew install verilator',
          docsUrl: 'https://verilator.org/guide/latest/install.html',
        };
      case 'iverilog':
        return {
          title: 'Icarus Verilog Simulator & GTKWave',
          linux: 'sudo apt update && sudo apt install iverilog gtkwave',
          windows: 'choco install iverilog  # or download installer from bleyer.org/icarus',
          macos: 'brew install icarus-verilog',
          docsUrl: 'https://steveicarus.github.io/iverilog/',
        };
      case 'yosys':
        return {
          title: 'Yosys Open Synthesis Suite',
          linux: 'sudo apt update && sudo apt install yosys',
          windows: 'oss-cad-suite: https://github.com/YosysHQ/oss-cad-suite-build',
          macos: 'brew install yosys',
          docsUrl: 'https://yosyshq.net/yosys/',
        };
      case 'qnn':
        return {
          title: 'Qualcomm Neural Network (QNN) SDK for Hexagon NPU',
          linux: 'Download Qualcomm AI Hub SDK for Snapdragon: pip install qai-hub',
          windows: 'Install Snapdragon AI SDK via Qualcomm Developer Network: https://developer.qualcomm.com/software/qualcomm-neural-processing-sdk',
          macos: 'N/A (Snapdragon NPU is Windows/Linux ARM64 native)',
          docsUrl: 'https://aihub.qualcomm.com/',
        };
    }
  }
}
