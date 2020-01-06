"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Color = require("color");
const colors = require("./colors.json");
const systemColors = require("./systemcolors.json");
const colorRegex = /Color\s*\.\s*FromName\s*\(\s*"([a-zA-Z]+)"\s*\)/g;
async function findName(text) {
    let match = colorRegex.exec(text);
    let result = [];
    while (match != null) {
        const matchedColor = match[1];
        const start = match.index + (match[0].length - matchedColor.length - 2);
        const end = colorRegex.lastIndex - 2;
        let hex = colors[matchedColor];
        if (!hex) {
            hex = systemColors[matchedColor];
        }
        if (hex) {
            const color = Color(hex).rgb().string();
            result.push({ start, end, color });
        }
        match = colorRegex.exec(text);
    }
    return result;
}
exports.findName = findName;
//# sourceMappingURL=name.js.map