# HEXA-R — Private On-Device AI Copilot for RTL Engineering

> **HEXA-R** is a private, offline AI copilot that lets hardware engineers write, debug, simulate, and verify RTL directly on Snapdragon-powered PCs using on-device AI.

---

## 🚀 Overview

Modern hardware design and VLSI engineering face a critical dilemma: **Intellectual Property (IP) security**. Semiconductor companies and students cannot upload proprietary Verilog/SystemVerilog designs and ASIC specifications to public cloud-based LLMs due to severe leakage risks. 

**HEXA-R** solves this by providing a production-quality, offline-first EDA (Electronic Design Automation) desktop environment powered locally by the **Qualcomm Snapdragon X Elite Hexagon NPU** via Qualcomm QNN and ONNX Runtime.

---

## ✨ Key Features

* **🛡️ 100% Offline & Private:** Zero cloud transmission of source code by default. Your proprietary RTL and hardware IP stay entirely on your local machine.
* **⚡ Snapdragon NPU Acceleration:** Harnesses Qualcomm Hexagon NPU hardware acceleration for fast, low-latency on-device AI inference (~42ms latency).
* **💻 Professional EDA IDE:** Built with a dark engineering theme, multi-pane layout, file explorer, and a **Monaco Editor** supporting Verilog/SystemVerilog syntax highlighting, folding, minimap, and error markers.
* **🔄 8-Stage Verification Pipeline:** One-click execution of parsing, static analysis, compilation, testbench generation, simulation, assertion checks, AI analysis, and report generation.
* **🤖 Intelligent Model Router:** Routes fast deterministic tasks (syntax checks, static analysis) to rule-based engines and complex reasoning/debugging to the local NPU LLM.
* **🛠️ Automated Testbenches & Auto-Fix:** Automatically generates comprehensive testbenches (clocks, resets, boundary tests, assertions) and provides GitHub-style code diffs to instantly apply AI-suggested bug fixes.
* **📊 Waveform & Diagnostics Viewer:** Integrated terminal console and signal diagnostics to track compiler traces and simulation failures seamlessly.

---

## 🏗️ Architecture & Tech Stack

* **Frontend:** React, TypeScript, Tailwind CSS, Monaco Editor, Lucide Icons.
* **Backend:** Python FastAPI / Node.js with local WebSocket & SSE streaming support.
* **Simulators & Tools (Adapters):** Verilator, Icarus Verilog, Yosys.
* **AI Engine & Hardware Abstraction:** 
  * Qualcomm AI Hub / ONNX Runtime
  * Qualcomm QNN Backend
  * Snapdragon Hexagon NPU / CPU Fallba
  *  app link (https://hexa-r-private-on-device-ai-copilot-for-rtl-engin.ai.studio)
