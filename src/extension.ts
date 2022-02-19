// Copyright (c) Robert Calvert. Licensed under the MIT license. 
// See LICENSE file in the project root for full license information.

import * as vscode from 'vscode';
import { Ticker } from './ticker';

// the tickers array
let tickers: Array<Ticker>;

// the refresh interval
let interval: NodeJS.Timeout | undefined;

// this method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {
	// construct the extension
	constructor();

	// call the constructor again if the configuration changes
	context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(constructor));
}

// construct the extension
function constructor() {
	// clear the interval if we already have one
	if (interval !== undefined) {
		clearInterval(interval);
	}

	// dispose of the tickers if we already have an array
	if (tickers !== undefined) {
		tickers.forEach(ticker => {
			ticker.dispose();
		});
	}

	// create a new ticker array
	tickers = new Array<Ticker>();

	// get the ticker definitions from the configuration
	const configuration: any = vscode.workspace.getConfiguration().get('crypto-ticker');
	const definitions: any = configuration.tickers;

	// create and add the tickers to the array
	definitions.forEach((definition: any, i: number) => {
		tickers.push(new Ticker(definition, definitions.length - i));
	});

	// create the interval and call refresh ever x seconds
	interval = setInterval(()=>refresh(configuration), configuration.interval * 1000);
}

// refresh the tickers
function refresh(configuration: any) {
	// exit early when refreshing is not required
	if (configuration.onlyRefreshWhenFocused && !vscode.window.state.focused) {
		return;
	}

	// iterate over the tickers and refresh
	tickers.forEach(ticker => {
		ticker.refresh();
	});
}

// this method is called when your extension is deactivated
export function deactivate() {
	// dispose of the tickers
	tickers.forEach(ticker => {
		ticker.dispose();
	});
}
