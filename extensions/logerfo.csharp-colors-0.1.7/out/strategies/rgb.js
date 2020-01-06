"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Color = require("color");
const rgbRegex = /(Color\s*\.\s*FromArgb\s*\()\s*(0[xXbB])?([0-9a-fA-F_]+)\s*,\s*(0[xXbB])?([0-9a-fA-F_]+)\s*,\s*(0[xXbB])?([0-9a-fA-F_]+)\s*\)/g;
async function findRGB(text) {
    let match = rgbRegex.exec(text);
    let result = [];
    while (match != null) {
        const start = match.index + match[1].length;
        const end = rgbRegex.lastIndex - 1; //cuts the close parenthesis
        let Rmodifier = match[2];
        const Rvalue = match[3].replace("_", "");
        let matchedR;
        if (Rmodifier) {
            Rmodifier = Rmodifier.toUpperCase();
            if (Rmodifier.startsWith("0X"))
                matchedR = parseInt(Rvalue, 16);
            else if (Rmodifier.startsWith("0B"))
                matchedR = parseInt(Rvalue, 2);
            else
                throw new Error("This is not supposed to happen");
        }
        else
            matchedR = +Rvalue;
        let Gmodifier = match[4];
        const Gvalue = match[5].replace("_", "");
        let matchedG;
        if (Gmodifier) {
            Gmodifier = Gmodifier.toUpperCase();
            if (Gmodifier.startsWith("0X"))
                matchedG = parseInt(Gvalue, 16);
            else if (Gmodifier.startsWith("0B"))
                matchedG = parseInt(Gvalue, 2);
            else
                throw new Error("This is not supposed to happen");
        }
        else
            matchedG = +Gvalue;
        let Bmodifier = match[6];
        const Bvalue = match[7].replace("_", "");
        let matchedB;
        if (Bmodifier) {
            Bmodifier = Bmodifier.toUpperCase();
            if (Bmodifier.startsWith("0X"))
                matchedB = parseInt(Bvalue, 16);
            else if (Bmodifier.startsWith("0B"))
                matchedB = parseInt(Bvalue, 2);
            else
                throw new Error("This is not supposed to happen");
        }
        else
            matchedB = +Bvalue;
        try {
            const color = Color.rgb(matchedR, matchedG, matchedB).rgb().string();
            result.push({ start, end, color });
        }
        catch (_a) { }
        match = rgbRegex.exec(text);
    }
    return result;
}
exports.findRGB = findRGB;
//# sourceMappingURL=rgb.js.map