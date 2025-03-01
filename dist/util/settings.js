import fs from 'fs';
import path from 'path';
const SETTINGS_FILE = path.join(__dirname, "../settings.json");
function saveSettings(data) {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(data, null, 2));
}
function loadSettings() {
    if (!fs.existsSync(SETTINGS_FILE)) {
        return {
            scramble_length: 12
        };
    }
    else {
        return JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8'));
    }
}
module.exports = {
    saveSettings,
    loadSettings
};
//# sourceMappingURL=settings.js.map