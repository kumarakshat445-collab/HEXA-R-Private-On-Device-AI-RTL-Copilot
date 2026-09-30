/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * HEXA-R Project Sidebar & Explorer
 * Crisp white background with deep black bold typography.
 */

import React, { useState } from 'react';
import { Project, RTLFile, RTLDiagnostic, ProjectFolder } from '../types';
import { 
  Folder, 
  FolderOpen, 
  FileCode, 
  FileText, 
  ShieldCheck, 
  Plus, 
  RotateCcw,
  ChevronDown,
  ChevronRight,
  Cpu
} from 'lucide-react';

interface SidebarProps {
  project: Project;
  activeFileId: string;
  diagnostics: RTLDiagnostic[];
  onSelectFile: (fileId: string) => void;
  onNewFile: () => void;
  onResetDemo: () => void;
  onOpenPrivacyCenter: () => void;
  onOpenNpuCenter: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  project,
  activeFileId,
  diagnostics,
  onSelectFile,
  onNewFile,
  onResetDemo,
  onOpenPrivacyCenter,
  onOpenNpuCenter,
}) => {
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set());

  const toggleFolder = (path: string) => {
    setCollapsedFolders(prev => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const renderFolder = (folder: ProjectFolder) => {
    const isCollapsed = collapsedFolders.has(folder.path);

    return (
      <div key={folder.id} className="select-none">
        {folder.path !== '' && (
          <div
            onClick={() => toggleFolder(folder.path)}
            className="flex items-center px-2 py-1.5 text-black hover:bg-slate-100 rounded-lg cursor-pointer transition-colors text-xs font-mono font-black"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4 mr-1 text-black" /> : <ChevronDown className="w-4 h-4 mr-1 text-black" />}
            {isCollapsed ? <Folder className="w-4 h-4 mr-1.5 text-black" /> : <FolderOpen className="w-4 h-4 mr-1.5 text-black" />}
            <span className="font-black text-black tracking-wide text-xs">{folder.name}/</span>
          </div>
        )}

        {!isCollapsed && (
          <div className={folder.path !== '' ? 'pl-4 space-y-1 mt-0.5' : 'space-y-1'}>
            {folder.subFolders?.map((sub: ProjectFolder) => renderFolder(sub))}

            {folder.files.map((file: RTLFile) => {
              const isActive = file.id === activeFileId;
              const fileDiags = diagnostics.filter(d => d.filePath === file.path || d.fileId === file.id);
              const hasErrors = fileDiags.some(d => d.severity === 'error');
              const hasWarnings = fileDiags.some(d => d.severity === 'warning');

              return (
                <div
                  key={file.id}
                  onClick={() => onSelectFile(file.id)}
                  className={`flex items-center justify-between px-3 py-1.5 rounded-lg cursor-pointer text-xs font-mono font-black transition-all ${
                    isActive
                      ? 'bg-black text-white font-black shadow-sm'
                      : 'text-black hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center space-x-2 truncate">
                    {file.type === 'markdown' ? (
                      <FileText className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-700'}`} />
                    ) : (
                      <FileCode className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-black'}`} />
                    )}
                    <span className="truncate tracking-tight font-black">{file.name}</span>
                  </div>

                  <div className="flex items-center space-x-1.5 flex-shrink-0">
                    {hasErrors && (
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-600 shadow-[0_0_6px_rgba(225,29,72,0.6)]" title="Static analysis error" />
                    )}
                    {hasWarnings && !hasErrors && (
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.6)]" title="Static analysis warning" />
                    )}
                    {file.isModified && (
                      <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-white' : 'bg-black'}`} title="Unsaved changes" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const meta = project.metadata;
  const passPercent = meta.testsCount > 0 ? Math.round((meta.passingTests / meta.testsCount) * 100) : 0;

  return (
    <aside className="w-64 bg-white border-r-2 border-slate-200 flex flex-col h-full select-none z-10 shadow-xs">
      
      {/* Workspace Header */}
      <div className="h-11 px-3.5 border-b-2 border-slate-200 flex items-center justify-between bg-slate-50">
        <span className="text-xs font-black text-black tracking-wider uppercase font-mono">
          PROJECT RTL FILES
        </span>

        <div className="flex items-center space-x-1">
          <button
            onClick={onNewFile}
            className="p-1.5 hover:bg-slate-200 text-black rounded-lg transition-colors cursor-pointer border border-slate-300"
            title="Create New RTL Module"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={onResetDemo}
            className="p-1.5 hover:bg-slate-200 text-black rounded-lg transition-colors cursor-pointer border border-slate-300"
            title="Reset to initial demo project (with intentional bug)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* File Tree */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {project.rootFolders.map((root: ProjectFolder) => renderFolder(root))}
      </div>

      {/* Bold Health & Privacy Summary Card */}
      <div className="p-3.5 border-t-2 border-slate-200 bg-slate-50 space-y-3">
        
        {/* Verification Status Progress Bar */}
        <div>
          <div className="flex justify-between items-center text-xs text-black mb-1.5">
            <span className="font-black uppercase tracking-tight text-[11px]">TEST VERIFICATION</span>
            <span className={`font-black font-mono ${meta.failingTests > 0 ? 'text-amber-600' : 'text-emerald-700'}`}>
              {meta.passingTests}/{meta.testsCount} ({passPercent}%)
            </span>
          </div>
          <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden border border-slate-300">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                meta.failingTests > 0 ? 'bg-amber-500' : 'bg-black'
              }`}
              style={{ width: `${passPercent}%` }}
            />
          </div>
        </div>

        {/* Clean Bold Badges */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            onClick={onOpenNpuCenter}
            className="p-2 rounded-lg bg-white hover:bg-slate-100 border-2 border-slate-300 text-left transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            title="Qualcomm Hexagon NPU"
          >
            <Cpu className="w-4 h-4 text-black flex-shrink-0" />
            <span className="truncate text-black font-black text-xs">NPU INT8</span>
          </button>

          <button
            onClick={onOpenPrivacyCenter}
            className="p-2 rounded-lg bg-white hover:bg-slate-100 border-2 border-slate-300 text-left transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            title="100% On-Device Protection"
          >
            <ShieldCheck className="w-4 h-4 text-black flex-shrink-0" />
            <span className="truncate text-black font-black text-xs">100% LOCAL</span>
          </button>
        </div>

      </div>

    </aside>
  );
};
