/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * HEXA-R User Profile & Workspace Storage Service
 * Fully offline-first, local-storage & indexed storage
 */

import { UserProfile, UserPreferences, UserEngineeringStats, Project, VerificationReport } from '../types';

const STORAGE_KEYS = {
  USER_PROFILE: 'hexar_user_profile',
  ACTIVE_PROJECT: 'hexar_active_project',
  PROJECT_LIST: 'hexar_project_list',
  VERIFICATION_REPORTS: 'hexar_verification_reports',
  RECENT_PROMPTS: 'hexar_recent_prompts',
};

const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'graphite-dark',
  fontSize: 13,
  tabSize: 2,
  minimap: true,
  wordWrap: true,
  autoSave: true,
  engineeringMode: 'professional',
  aiBackend: 'snapdragon_npu',
  preferredModel: 'Llama 3 8B INT8 (Snapdragon QNN)',
  allowCloudAI: false,       // PRIVACY REQUIREMENT: OFF by default
  telemetryEnabled: false,   // PRIVACY REQUIREMENT: OFF by default
  localWorkspacePath: '~/hexar_workspace',
  verilatorPath: '/usr/bin/verilator',
  iverilogPath: '/usr/bin/iverilog',
  yosysPath: '/usr/bin/yosys',
  qnnRuntimePath: '/opt/qcom/qnn',
};

const DEFAULT_STATS: UserEngineeringStats = {
  projectsCount: 1,
  verificationsRun: 14,
  bugsFixedByAI: 6,
  linesOfRtlGenerated: 850,
  totalSimulations: 28,
  lastVerificationDate: new Date().toISOString(),
};

export const defaultUserProfile: UserProfile = {
  id: 'usr_snapdragon_dev',
  name: 'Hardware Engineer',
  role: 'Senior RTL / Digital Design Engineer',
  organization: 'Snapdragon Hardware Systems',
  experienceLevel: 'professional',
  createdAt: new Date().toISOString(),
  lastActiveAt: new Date().toISOString(),
  preferences: DEFAULT_PREFERENCES,
  stats: DEFAULT_STATS,
};

export class StorageService {
  /**
   * Get current user profile or initialize default
   */
  static getUserProfile(): UserProfile {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn('Failed to read user profile from local storage, using default:', e);
    }
    this.saveUserProfile(defaultUserProfile);
    return defaultUserProfile;
  }

  /**
   * Save user profile
   */
  static saveUserProfile(profile: UserProfile): void {
    try {
      profile.lastActiveAt = new Date().toISOString();
      localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
    } catch (e) {
      console.error('Failed to save user profile to local storage:', e);
    }
  }

  /**
   * Update user preferences
   */
  static updatePreferences(partial: Partial<UserPreferences>): UserPreferences {
    const profile = this.getUserProfile();
    profile.preferences = { ...profile.preferences, ...partial };
    this.saveUserProfile(profile);
    return profile.preferences;
  }

  /**
   * Increment stats
   */
  static recordVerification(passed: boolean): void {
    const profile = this.getUserProfile();
    profile.stats.verificationsRun += 1;
    profile.stats.totalSimulations += 1;
    profile.stats.lastVerificationDate = new Date().toISOString();
    this.saveUserProfile(profile);
  }

  static recordBugFixed(): void {
    const profile = this.getUserProfile();
    profile.stats.bugsFixedByAI += 1;
    this.saveUserProfile(profile);
  }

  static recordRtlGenerated(lines: number): void {
    const profile = this.getUserProfile();
    profile.stats.linesOfRtlGenerated += lines;
    this.saveUserProfile(profile);
  }

  /**
   * Project Storage
   */
  static saveActiveProject(project: Project): void {
    try {
      project.metadata.updatedAt = new Date().toISOString();
      localStorage.setItem(STORAGE_KEYS.ACTIVE_PROJECT, JSON.stringify(project));
    } catch (e) {
      console.error('Failed to save active project:', e);
    }
  }

  static getActiveProject(): Project | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ACTIVE_PROJECT);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error('Failed to load active project:', e);
    }
    return null;
  }

  /**
   * Verification Reports
   */
  static saveVerificationReport(report: VerificationReport): void {
    try {
      const existing = this.getVerificationReports();
      const updated = [report, ...existing.slice(0, 19)]; // Keep last 20 reports
      localStorage.setItem(STORAGE_KEYS.VERIFICATION_REPORTS, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save verification report:', e);
    }
  }

  static getVerificationReports(): VerificationReport[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.VERIFICATION_REPORTS);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error('Failed to load reports:', e);
    }
    return [];
  }
}
