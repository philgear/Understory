const fs = require('fs');
const files = fs.readdirSync('.lighthouseci').filter(f => f.endsWith('.json') && !f.includes('manifest'));
files.sort((a, b) => fs.statSync('.lighthouseci/' + a).mtime.getTime() - fs.statSync('.lighthouseci/' + b).mtime.getTime());
const latest = files[files.length - 1];
const data = JSON.parse(fs.readFileSync('.lighthouseci/' + latest, 'utf8'));

console.log('--- Opportunities ---');
for (const key of Object.keys(data.audits)) {
    const audit = data.audits[key];
    if (audit.details && audit.details.type === 'opportunity' && audit.score < 1) {
        console.log(`${Math.round(audit.details.overallSavingsMs)}ms : ${audit.title}`);
    }
}

console.log('\n--- Unused JS Details ---');
if (data.audits['unused-javascript'] && data.audits['unused-javascript'].details) {
    for (const item of data.audits['unused-javascript'].details.items || []) {
        console.log(`${item.url.split('/').pop()} - Wasted: ${(item.wastedBytes / 1024).toFixed(1)} KB`);
    }
}

console.log('\n--- CLS Details ---');
if (data.audits['layout-shifts'] && data.audits['layout-shifts'].details) {
    for (const item of data.audits['layout-shifts'].details.items || []) {
        if (item.node && item.node.selector) console.log(`Shift ${item.score.toFixed(3)}: ${item.node.selector}`);
    }
}
