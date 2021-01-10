// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as config from './components/config/config';
import { fs } from './fs';
import { host } from './host';
import { shell } from './shell';
import { create as createTiUP } from './tiup';

const tiup = createTiUP(config.getTiUPVersioning(), host, fs, shell);

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
	console.log('TiCode activated!');

	const subscriptions = [
		registerCommand('ticode.playground', tiupPlayground),
		registerCommand('ticode.help', tiupHelp),
	];

	subscriptions.forEach((x) => context.subscriptions.push(x));
}

// this method is called when your extension is deactivated
export function deactivate() { }

function registerCommand(command: string, callback: (...args: any[]) => any): vscode.Disposable {
	// TODO: add telemetry for usage data collection
	// const wrappedCallback = telemetry.telemetrise(command, tiup, callback);
	const wrappedCallback = callback;
	return vscode.commands.registerCommand(command, wrappedCallback);
}

async function tiupPlayground() {
	vscode.window.showInformationMessage('TiCode Playground');
	await tiup.invokeInSharedTerminal("playground");
}

async function tiupHelp() {
	vscode.window.showInformationMessage('TiCode Help');
	await tiup.invokeInSharedTerminal("help");
}
