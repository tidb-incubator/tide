import * as vscode from 'vscode';
import * as path from 'path';
import { getToolPath, getUseWsl } from './components/config/config';
import { host } from './host';

export enum Platform {
    Windows,
    MacOS,
    Linux,
    Unsupported,  // shouldn't happen!
}

export interface Shell {
    isWindows(): boolean;
    isUnix(): boolean;
    platform(): Platform;
}

export const shell: Shell = {
    isWindows : isWindows,
    isUnix : isUnix,
    platform : platform,
};

export function shellEnvironment(baseEnvironment: any): any {
    const env = Object.assign({}, baseEnvironment);
    const pathVariable = pathVariableName(env);
    for (const tool of ['tiup']) {
        const toolPath = getToolPath(host, shell, tool);
        if (toolPath) {
            const toolDirectory = path.dirname(toolPath);
            const currentPath = env[pathVariable];
            env[pathVariable] = toolDirectory + (currentPath ? `${pathEntrySeparator()}${currentPath}` : '');
        }
    }

    // TODO: setup tiup config here
    // const kubeconfigPath = getKubeconfigPath();
    // env['KUBECONFIG'] = kubeconfigPath.pathType === "host" ? kubeconfigPath.hostPath : kubeconfigPath.wslPath;
    return env;
}

function pathVariableName(env: any): string {
    if (isWindows()) {
        for (const v of Object.keys(env)) {
            if (v.toLowerCase() === "path") {
                return v;
            }
        }
    }
    return "PATH";
}

const WINDOWS: string = 'win32';

function isWindows(): boolean {
    return (process.platform === WINDOWS) && !getUseWsl();
}

function isUnix(): boolean {
    return !isWindows();
}

function platform(): Platform {
    if (getUseWsl()) {
        return Platform.Linux;
    }
    switch (process.platform) {
        case 'win32': return Platform.Windows;
        case 'darwin': return Platform.MacOS;
        case 'linux': return Platform.Linux;
        default: return Platform.Unsupported;
    }
}

function pathEntrySeparator() {
    return isWindows() ? ';' : ':';
}
