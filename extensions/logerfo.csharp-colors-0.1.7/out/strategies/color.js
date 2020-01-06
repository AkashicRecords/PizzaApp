"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Color = require("color");
const colors = require("./colors.json");
const colorRegex = /Color\s*\.\s*([a-zA-Z]+)/g;
async function findColor(text) {
    let match = colorRegex.exec(text);
    let result = [];
    while (match != null) {
        const matchedColor = match[1];
        const start = match.index + (match[0].length - matchedColor.length);
        const end = colorRegex.lastIndex;
        const hex = colors[matchedColor];
        if (hex) {
            const color = Color(hex).rgb().string();
            result.push({ start, end, color });
        }
        match = colorRegex.exec(text);
    }
    return result;
}
exports.findColor = findColor;
//# sourceMappingURL=color.js.map