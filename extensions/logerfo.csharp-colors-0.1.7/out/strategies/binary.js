"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const Color = require("color");
const hexRegex = /Color\.FromArgb\(0[bB]([01]+)\)/g;
function findBinary(text) {
    return __awaiter(this, void 0, void 0, function* () {
        let match = hexRegex.exec(text);
        let result = [];
        while (match != null) {
            const start = match.index + 15;
            const end = hexRegex.lastIndex;
            const matchedColor = match[1];
            const color = Color.rgb(`#${parseInt(matchedColor, 2).toString(16)}`).rgb().string();
            result.push({ start, end, color });
            match = hexRegex.exec(text);
        }
        return result;
    });
}
exports.findBinary = findBinary;
//# sourceMappingURL=binary.js.map