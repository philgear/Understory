const fs = require('fs');
const files = fs.readdirSync('.lighthouseci').filter(f => f.endsWith('.json') && !f.includes('manifest'));
files.sort((a, b) => fs.statSync('.lighthouseci/' + a).mtime.getTime() - fs.statSync('.lighthouseci/' + b).mtime.getTime());
const latest = files[files.length - 1];
const data = JSON.parse(fs.readFileSync('.lighthouseci/' + latest, 'utf8'));
console.log('--- Lighthouse Scores ---');
console.log('Performance:', data.categories.performance.score * 100);
console.log('Accessibility:', data.categories.accessibility.score * 100);
console.log('Best Practices:', data.categories['best-practices'].score * 100);
console.log('SEO:', data.categories.seo.score * 100);

if (data.categories.performance.score < 1) {
    console.log('\n--- Performance Issues ---');
    const audits = data.audits;
    for (const key of Object.keys(audits)) {
        if (audits[key].score !== null && audits[key].score < 1 && audits[key].weight > 0) {
            console.log(`${audits[key].title} (Score: ${audits[key].score})`);
            if (audits[key].displayValue) console.log('  Value:', audits[key].displayValue);
        }
    }
}
