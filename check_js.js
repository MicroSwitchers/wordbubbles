const fs = require('fs');
const { execSync } = require('child_process');
const html = fs.readFileSync('index.html', 'utf8');

// Find main script block (3rd <script>)
let idx = 0, count = 0;
while (count < 2) {
    idx = html.indexOf('<script', idx) + 1;
    count++;
}
idx--; // back to start of 3rd <script>
const scriptTagStart = html.indexOf('<script>', idx) + 8;
const scriptEnd = html.indexOf('</script>', scriptTagStart);
const script = html.substring(scriptTagStart, scriptEnd);

fs.writeFileSync('test_script.js', script);
try {
    execSync('node --check test_script.js', { encoding: 'utf8', stdio: 'pipe' });
    console.log('✅ No syntax errors!');
} catch (e) {
    console.log('❌ Error:', e.stderr || e.stdout);
}
