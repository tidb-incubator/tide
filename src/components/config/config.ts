import * as vscode from 'vscode';
import { Host } from '../../host';
import { Shell, Platform } from '../../shell';

const EXTENSION_CONFIG_KEY = "ticode";
const TIUP_VERSIONING_KEY = "ticode.tiupVersioning";

export enum TiUPVersioning {
    UserProvided = 1,
    Infer = 2,
}

// Functions for working with tool paths

export function getToolPath(host: Host, shell: Shell, tool: string): string | undefined {
    const baseKey = toolPathBaseKey(tool);
    return getPathSetting(host, shell, baseKey);
}

function getPathSetting(host: Host, shell: Shell, baseKey: string): string | undefined {
    const os = shell.platform();
    const osOverridePath = host.getConfiguration(EXTENSION_CONFIG_KEY)[osOverrideKey(os, baseKey)];
    return osOverridePath || host.getConfiguration(EXTENSION_CONFIG_KEY)[baseKey];
}

function toolPathBaseKey(tool: string): string {
    return `${EXTENSION_CONFIG_KEY}.${tool}-path`;
}

function osOverrideKey(os: Platform, baseKey: string): string {
    const osKey = osKeyString(os);
    return osKey ? `${baseKey}.${osKey}` : baseKey;  // The 'else' clause should never happen so don't worry that this would result in double-checking a missing base key
}

function osKeyString(os: Platform): string | null {
    switch (os) {
        case Platform.Windows: return 'windows';
        case Platform.MacOS: return 'mac';
        case Platform.Linux: return 'linux';
        default: return null;
    }
}

export function affectsUs(change: vscode.ConfigurationChangeEvent) {
    return change.affectsConfiguration(EXTENSION_CONFIG_KEY);
}

export function getTiUPVersioning(): TiUPVersioning {
    const configValue = vscode.workspace.getConfiguration(EXTENSION_CONFIG_KEY)[TIUP_VERSIONING_KEY];
    if (configValue === "infer") {
        return TiUPVersioning.Infer;
    }
    return TiUPVersioning.UserProvided;
}

// Use WSL on Windows

const USE_WSL_KEY = "use-wsl";

export function getUseWsl(): boolean {
    return vscode.workspace.getConfiguration(EXTENSION_CONFIG_KEY)[USE_WSL_KEY];
}
