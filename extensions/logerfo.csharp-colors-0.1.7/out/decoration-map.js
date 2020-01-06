'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
class DecorationMap {
    constructor() {
        this._map = new Map();
        this._keys = [];
    }
    get(color) {
        if (!this._map.has(color)) {
            let rules = {};
            rules.color = 'invalid; border-bottom:solid 2px ' + color;
            this._map.set(color, vscode.window.createTextEditorDecorationType(rules));
            this._keys.push(color);
        }
        return this._map.get(color);
    }
    keys() {
        return this._keys.slice();
    }
    dispose() {
        this._map.forEach((decoration) => {
            decoration.dispose();
        });
    }
}
exports.DecorationMap = DecorationMap;
//# sourceMappingURL=decoration-map.js.map