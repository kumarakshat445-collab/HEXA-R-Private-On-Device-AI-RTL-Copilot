/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * HEXA-R Monaco RTL Editor
 * Crisp white background with bold black typography, high-contrast SystemVerilog syntax,
 * and smooth floating action pills.
 */

import React, { useRef, useEffect, useState } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { RTLFile, RTLDiagnostic } from '../../types';
import { 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  HelpCircle, 
  Wand2, 
  ShieldCheck, 
  Cpu, 
  X,
  FileCode
} from 'lucide-react';

interface MonacoRtlEditorProps {
  file: RTLFile | null;
  diagnostics: RTLDiagnostic[];
  fontSize: number;
  minimap: boolean;
  wordWrap: boolean;
  onChangeContent: (content: string) => void;
  onSelectAction: (action: string, selectedText: string) => void;
  onApplyDiagnosticFix: (diagnostic: RTLDiagnostic) => void;
}

export const MonacoRtlEditor: React.FC<MonacoRtlEditorProps> = ({
  file,
  diagnostics,
  fontSize,
  minimap,
  wordWrap,
  onChangeContent,
  onSelectAction,
  onApplyDiagnosticFix,
}) => {
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const [selectedText, setSelectedText] = useState('');
  const [floatingPos, setFloatingPos] = useState<{ x: number; y: number } | null>(null);

  // Configure SystemVerilog language keywords and tokens on Monaco mount
  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Register SystemVerilog if not already defined
    if (!monaco.languages.getLanguages().some((l: any) => l.id === 'systemverilog')) {
      monaco.languages.register({ id: 'systemverilog' });
      monaco.languages.setMonarchTokensProvider('systemverilog', {
        keywords: [
          'module', 'endmodule', 'input', 'output', 'inout', 'logic', 'wire', 'reg',
          'always', 'always_ff', 'always_comb', 'always_latch', 'initial', 'assign',
          'begin', 'end', 'if', 'else', 'case', 'endcase', 'default', 'for', 'while',
          'posedge', 'negedge', 'parameter', 'localparam', 'typedef', 'enum', 'struct',
          'package', 'endpackage', 'import', 'function', 'endfunction', 'task', 'endtask',
          'assert', 'property', 'endproperty', 'cover', 'sequence', 'disable', 'iff',
          'generate', 'endgenerate', 'genvar', 'timescale'
        ],
        typeKeywords: ['bit', 'byte', 'shortint', 'int', 'longint', 'integer', 'time', 'real', 'string', 'void'],
        operators: [
          '=', '<=', '==', '!=', '===', '!==', '>', '<', '>=', '<=', '&&', '||', '!',
          '&', '|', '^', '~', '~&', '~|', '^~', '~^', '<<', '>>', '<<<', '>>>', '+', '-', '*', '/', '%'
        ],
        tokenizer: {
          root: [
            [/[a-zA-Z_]\w*/, {
              cases: {
                '@keywords': 'keyword',
                '@typeKeywords': 'type',
                '@default': 'identifier'
              }
            }],
            { include: '@whitespace' },
            [/[{}()[\]]/, '@brackets'],
            [/[<>](?!@symbols)/, '@brackets'],
            [/@operators/, 'operator'],
            [/\d+'[bBoOdDhH][0-9a-fA-F_xXzZ]+/, 'number.hex'],
            [/\d+/, 'number'],
            [/"([^"\\]|\\.)*"/, 'string'],
            [/\`[a-zA-Z_]\w*/, 'annotation'],
          ],
          whitespace: [
            [/[ \t\r\n]+/, 'white'],
            [/\/\*/, 'comment', '@comment'],
            [/\/\/.*$/, 'comment'],
          ],
          comment: [
            [/[^\/*]+/, 'comment'],
            [/\/\*/, 'comment', '@push'],
            [/\*\//, 'comment', '@pop'],
            [/[\/*]/, 'comment']
          ],
        }
      });

      // Whitish-Black High-Contrast Theme for Monaco with Bold Black Text (No Blue)
      monaco.editor.defineTheme('hexa-light', {
        base: 'vs',
        inherit: true,
        rules: [
          { token: 'keyword', foreground: '000000', fontStyle: 'bold' },
          { token: 'type', foreground: '0f172a', fontStyle: 'bold' },
          { token: 'identifier', foreground: '111827', fontStyle: 'bold' },
          { token: 'number', foreground: 'b45309', fontStyle: 'bold' },
          { token: 'number.hex', foreground: 'b45309', fontStyle: 'bold' },
          { token: 'string', foreground: '15803d', fontStyle: 'bold' },
          { token: 'comment', foreground: '64748b', fontStyle: 'bold italic' },
          { token: 'operator', foreground: '000000', fontStyle: 'bold' },
          { token: 'annotation', foreground: '000000', fontStyle: 'bold' },
        ],
        colors: {
          'editor.background': '#ffffff',
          'editor.foreground': '#000000',
          'editor.lineHighlightBackground': '#f8fafc',
          'editorLineNumber.foreground': '#94a3b8',
          'editorLineNumber.activeForeground': '#000000',
          'editor.selectionBackground': '#e2e8f0',
          'editorCursor.foreground': '#000000',
        }
      });
    }

    monaco.editor.setTheme('hexa-light');

    // Selection change listener for Floating AI Action Bar
    editor.onDidChangeCursorSelection((e: any) => {
      const selection = editor.getSelection();
      if (!selection || selection.isEmpty()) {
        setSelectedText('');
        setFloatingPos(null);
        return;
      }

      const text = editor.getModel()?.getValueInRange(selection);
      if (text && text.trim().length > 0) {
        setSelectedText(text);
        const position = editor.getScrolledVisiblePosition(selection.getEndPosition());
        if (position) {
          setFloatingPos({ x: Math.min(position.left + 50, window.innerWidth - 450), y: Math.max(position.top + 30, 80) });
        }
      } else {
        setSelectedText('');
        setFloatingPos(null);
      }
    });

    // Right-click context actions
    editor.addAction({
      id: 'hexa-explain',
      label: 'HEXA-R: Explain Selected RTL',
      contextMenuGroupId: 'hexar',
      run: (ed: any) => {
        const text = ed.getModel()?.getValueInRange(ed.getSelection());
        onSelectAction('explain', text || file?.content || '');
      }
    });

    editor.addAction({
      id: 'hexa-fix',
      label: 'HEXA-R: Find Bugs & Auto-Fix',
      contextMenuGroupId: 'hexar',
      run: (ed: any) => {
        const text = ed.getModel()?.getValueInRange(ed.getSelection());
        onSelectAction('debug', text || file?.content || '');
      }
    });

    editor.addAction({
      id: 'hexa-synthesizability',
      label: 'HEXA-R: Check Synthesizability',
      contextMenuGroupId: 'hexar',
      run: (ed: any) => {
        onSelectAction('synthesizability', file?.content || '');
      }
    });

    editor.addAction({
      id: 'hexa-tb',
      label: 'HEXA-R: Generate Testbench',
      contextMenuGroupId: 'hexar',
      run: () => {
        onSelectAction('testbench', file?.content || '');
      }
    });

    updateMarkers();
  };

  // Sync Diagnostics with Monaco markers (squiggles & error gutter)
  const updateMarkers = () => {
    if (!editorRef.current || !monacoRef.current || !file) return;
    const model = editorRef.current.getModel();
    if (!model) return;

    const fileDiags = diagnostics.filter(d => d.filePath === file.path || d.fileId === file.id);

    const markers = fileDiags.map(d => ({
      startLineNumber: d.line,
      startColumn: 1,
      endLineNumber: d.line,
      endColumn: 120,
      message: `[HEXA-R ${d.severity.toUpperCase()}] ${d.problem}\nWhy it matters: ${d.whyItMatters}\nFix: ${d.suggestedFix || 'See diagnostics'}`,
      severity: d.severity === 'error' 
        ? monacoRef.current.MarkerSeverity.Error 
        : monacoRef.current.MarkerSeverity.Warning,
    }));

    monacoRef.current.editor.setModelMarkers(model, 'hexar-analyzer', markers);
  };

  useEffect(() => {
    updateMarkers();
  }, [diagnostics, file]);

  if (!file) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-white text-black font-mono text-xs">
        <FileCode className="w-12 h-12 mb-3 text-slate-400" />
        <p className="font-black text-sm">NO RTL FILE SELECTED</p>
        <p className="text-black font-bold mt-1">Select a file from the Project explorer on the left</p>
      </div>
    );
  }

  // Active file diagnostics count
  const fileDiags = diagnostics.filter(d => d.filePath === file.path || d.fileId === file.id);
  const errorCount = fileDiags.filter(d => d.severity === 'error').length;
  const warningCount = fileDiags.filter(d => d.severity === 'warning').length;

  return (
    <div className="flex-1 flex flex-col relative h-full bg-white overflow-hidden">
      {/* Editor Sub-header Bar (Crisp White with Bold Black Text) */}
      <div className="h-10 px-4 bg-white border-b-2 border-slate-200 flex items-center justify-between text-xs font-mono select-none">
        <div className="flex items-center space-x-3">
          <span className="text-black font-black flex items-center gap-2 tracking-tight text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-black"></span>
            {file.path}
          </span>
          {file.isModified && (
            <span className="text-black text-[11px] font-black bg-amber-300 px-2 py-0.5 rounded border-2 border-black uppercase">
              MODIFIED
            </span>
          )}
          {file.isTestbench && (
            <span className="text-black text-[11px] font-black bg-slate-100 px-2 py-0.5 rounded border-2 border-black uppercase">
              TESTBENCH (SVA)
            </span>
          )}
        </div>

        {/* Diagnostics Badges */}
        <div className="flex items-center space-x-2">
          {errorCount > 0 && (
            <span className="flex items-center gap-1.5 text-black bg-rose-200 px-2.5 py-0.5 rounded-md border-2 border-black text-xs font-black shadow-xs">
              <X className="w-3.5 h-3.5 text-black" /> {errorCount} {errorCount === 1 ? 'ERROR' : 'ERRORS'}
            </span>
          )}
          {warningCount > 0 && (
            <span className="flex items-center gap-1.5 text-black bg-amber-200 px-2.5 py-0.5 rounded-md border-2 border-black text-xs font-black shadow-xs">
              <AlertTriangle className="w-3.5 h-3.5 text-black" /> {warningCount} {warningCount === 1 ? 'WARNING' : 'WARNINGS'}
            </span>
          )}
          {fileDiags.length === 0 && (
            <span className="flex items-center gap-1.5 text-black bg-emerald-100 px-2.5 py-0.5 rounded-md border-2 border-black text-xs font-black shadow-xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-black" /> CLEAN RTL
            </span>
          )}
        </div>
      </div>

      {/* Monaco Editor Container */}
      <div className="flex-1 w-full relative bg-white">
        <Editor
          height="100%"
          language={file.type === 'markdown' ? 'markdown' : 'systemverilog'}
          value={file.content}
          theme="hexa-light"
          onChange={val => onChangeContent(val || '')}
          onMount={handleEditorDidMount}
          options={{
            fontSize,
            fontWeight: '800',
            fontFamily: "'JetBrains Mono', 'Fira Code', Menlo, monospace",
            minimap: { enabled: minimap },
            wordWrap: wordWrap ? 'on' : 'off',
            scrollBeyondLastLine: false,
            renderWhitespace: 'selection',
            lineNumbers: 'on',
            folding: true,
            bracketPairColorization: { enabled: true },
            glyphMargin: true,
            tabSize: 2,
            automaticLayout: true,
            readOnly: file.readOnly,
          }}
        />

        {/* Floating Quick Action Bar upon Selection with Floating Animation */}
        {floatingPos && selectedText && (
          <div
            style={{ top: `${floatingPos.y}px`, left: `${floatingPos.x}px` }}
            className="absolute z-30 bg-white border-2 border-black rounded-full shadow-2xl p-1.5 flex items-center space-x-2 animate-bob backdrop-blur-md"
          >
            <span className="text-xs font-mono text-black font-black px-2 flex items-center gap-1">
              <Sparkles className="w-4 h-4 text-black" /> HEXA-R:
            </span>
            <button
              onClick={() => onSelectAction('explain', selectedText)}
              className="px-3 py-1 text-xs font-black font-mono rounded-full bg-white hover:bg-black hover:text-white text-black border-2 border-black transition-all flex items-center gap-1 cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5" /> Explain
            </button>
            <button
              onClick={() => onSelectAction('debug', selectedText)}
              className="px-3 py-1 text-xs font-black font-mono rounded-full bg-amber-200 hover:bg-amber-300 text-black border-2 border-black transition-all flex items-center gap-1 cursor-pointer"
            >
              <Wand2 className="w-3.5 h-3.5" /> Fix Bugs
            </button>
            <button
              onClick={() => onSelectAction('assertions', selectedText)}
              className="px-3 py-1 text-xs font-black font-mono rounded-full bg-white hover:bg-black hover:text-white text-black border-2 border-black transition-all flex items-center gap-1 cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5" /> Assertions
            </button>
            <button
              onClick={() => onSelectAction('synthesizability', selectedText)}
              className="px-3 py-1 text-xs font-black font-mono rounded-full bg-emerald-200 hover:bg-emerald-300 text-black border-2 border-black transition-all flex items-center gap-1 cursor-pointer"
            >
              <Cpu className="w-3.5 h-3.5" /> Synthesizability
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
