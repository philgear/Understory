const fs = require('fs');
const files = fs.readdirSync('.lighthouseci').filter(f => f.endsWith('.json') && !f.includes('manifest'));
files.sort((a, b) => fs.statSync('.lighthouseci/' + a).mtime.getTime() - fs.statSync('.lighthouseci/' + b).mtime.getTime());
const latest = files[files.length - 1];
const data = JSON.parse(fs.readFileSync('.lighthouseci/' + latest, 'utf8'));

const refs = data.categories.performance.auditRefs;
for (const ref of refs) {
    const audit = data.audits[ref.id];
    if (audit && audit.score !== null && audit.score < 1 && ref.weight > 0) {
        console.log(audit.title, ':', audit.displayValue || audit.score);
    }
}
