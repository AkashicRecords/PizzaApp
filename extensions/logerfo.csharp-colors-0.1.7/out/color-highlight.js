'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const systemcolor_1 = require("./strategies/systemcolor");
const color_1 = require("./strategies/color");
const name_1 = require("./strategies/name");
const rgb_1 = require("./strategies/rgb");
const argb_1 = require("./strategies/argb");
const int_1 = require("./strategies/int");
const decoration_map_1 = require("./decoration-map");
class DocumentHighlight {
    constructor(document) {
        this.disposed = false;
        this.document = document;
        this.strategies = [systemcolor_1.findSystemColor, color_1.findColor, name_1.findName, rgb_1.findRGB, argb_1.findARGB, int_1.findInt];
        this.decorations = new decoration_map_1.DecorationMap();
        this.listner = vscode.workspace.onDidChangeTextDocument(({ document }) => this.onUpdate(document));
    }
    onUpdate(document = this.document) {
        if (this.disposed || this.document.uri.toString() !== document.uri.toString()) {
            return;
        }
        const text = this.document.getText();
        const version = this.document.version.toString();
        return this.updateRange(text, version);
    }
    updateRange(text, version) {
        return Promise.all(this.strategies.map(fn => fn(text)))
            .then(result => {
            const actualVersion = this.document.version.toString();
            if (actualVersion === version)
                return result;
        })
            .then(concatAll)
            .then(groupByColor)
            .then(colorRanges => {
            if (this.disposed) {
                return false;
            }
            const updateStack = this.decorations._keys.slice()
                .reduce((state, color) => {
                state[color] = [];
                return state;
            }, {});
            for (const color in colorRanges) {
                updateStack[color] = colorRanges[color].map(item => {
                    return new vscode.Range(this.document.positionAt(item.start), this.document.positionAt(item.end));
                });
            }
            for (const color in updateStack) {
                const decoration = this.decorations.get(color);
                vscode.window.visibleTextEditors
                    .filter(({ document }) => document.uri === this.document.uri)
                    .forEach(editor => editor.setDecorations(decoration, updateStack[color]));
            }
        }).catch(error => { console.log(error); });
    }
    dispose() {
        this.disposed = true;
        this.decorations.dispose();
        this.listner.dispose();
        this.decorations = null;
        this.document = null;
        this.listner = null;
    }
}
exports.DocumentHighlight = DocumentHighlight;
function groupByColor(results) {
    if (results)
        return results.reduce((collection, item) => {
            if (!collection[item.color]) {
                collection[item.color] = [];
            }
            collection[item.color].push(item);
            return collection;
        }, {});
}
function concatAll(arr) {
    if (arr)
        return arr.reduce((result, item) => result.concat(item), []);
}
//# sourceMappingURL=color-highlight.js.map