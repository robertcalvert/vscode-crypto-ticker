// Copyright (c) Robert Calvert. Licensed under the MIT license.
// See LICENSE file in the project root for full license information.

import * as vscode from 'vscode';

// the web request handler
const got = require('got');

// represents a ticker object
export class Ticker {
    // the tickers status bar item
    item: vscode.StatusBarItem;

    // the definition properties
    symbol: string;
    currency: string;
    exchange: string;
    template: string;

    // the configuration properties
    apiKey: string;
    period: string;
    higherColor: string;
    lowerColor: string;

    // construct a new ticker based on a ticker definition
    constructor(definition: any, priority: number) {
        // set the definition properties
        this.item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, priority);
        this.symbol = definition.symbol;
        this.currency = definition.currency || 'USD';
        this.exchange = definition.exchange || 'CCCAGG';
        this.template = definition.template || '{symbol} {price}';

        // set the configuration properties
        const configuration: any = vscode.workspace.getConfiguration().get('crypto-ticker');
        this.apiKey = configuration.apiKey;
        this.period = configuration.period;
        this.higherColor = configuration.higherColor;
        this.lowerColor = configuration.lowerColor;

        // handle the first refresh call
        this.refresh();
    }

    // dispose of the ticker
    dispose() {
        // hide and dispose the status bar item
        this.item.hide();
        this.item.dispose();
    }

    // refresh the ticker
    refresh() {
        (async () => {
            try {
                // get the service URL, including the API key when present
                let url = `https://min-api.cryptocompare.com/data/pricemultifull?fsyms=${this.symbol}&tsyms=${this.currency}&e=${this.exchange}`;
                if (this.apiKey !== '') {
                    url += `&api_key=${this.apiKey}`;
                }

                // call the service and parse the response
                const response = await got(url);
                const object = JSON.parse(response.body);

                // get the required values
                const price: string = object.DISPLAY[this.symbol][this.currency].PRICE;
                const open: string = object.DISPLAY[this.symbol][this.currency]['OPEN' + this.period];
                const high: string = object.DISPLAY[this.symbol][this.currency]['HIGH' + this.period];
                const low: string = object.DISPLAY[this.symbol][this.currency]['LOW' + this.period];
                const percent: number = object.DISPLAY[this.symbol][this.currency]['CHANGEPCT' + this.period];
                const change: string = object.DISPLAY[this.symbol][this.currency]['CHANGE' + this.period];

                // set the status bar item text using the template
                this.item.text = this.template.replace('{symbol}', this.symbol)
                    .replace('{price}', price)
                    .replace('{open}', open)
                    .replace('{high}', high)
                    .replace('{low}', low)
                    .replace('{change}', change)
                    .replace('{percent}', (percent >= 0 ? '+' : '') + percent + '%');

                // set the status bar item colour based on the percent change
                this.item.color = (percent < 0) ? this.lowerColor : this.higherColor;

                // make sure the status bar item is visible
                this.item.show();

            } catch (error) {
                // log the error and hide the status bar item
                console.log(error.message);
                this.item.hide();
            }
        })();

    }

}