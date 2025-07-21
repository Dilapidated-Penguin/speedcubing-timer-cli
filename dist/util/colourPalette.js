"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analogous = analogous;
exports.tetratic = tetratic;
exports.monochromatic = monochromatic;
function analogous(h, s, l) {
    const res = {
        complementary: [(h + 30) % 360, s, l],
        third_hue: [(h - 30) % 360, s, l],
        fourth_hue: [(h + 60) % 360, s, l],
        fifth_hue: [(h - 60) % 360, s, l]
    };
    return res;
}
function tetratic(h, s, l) {
    const res = {
        complementary: [(h + 180) % 360, s, l],
        third_hue: [(h - 90) % 360, s, l],
        fourth_hue: [(h + 270) % 360, s, l],
        fifth_hue: [h, s * 0.8, Math.min(l * 1.2, 100)]
    };
    return res;
}
function monochromatic(h, s, l) {
    const res = {
        complementary: [(h + 180) % 360, s, l],
        third_hue: [h, s * 0.9, l],
        fourth_hue: [h, s * 0.8, l],
        fifth_hue: [h, s * 0.7, l]
    };
    return res;
}
//# sourceMappingURL=colourPalette.js.map