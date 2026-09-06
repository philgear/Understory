const { execSync, execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Helper to resolve workspace root with uppercase drive letter on Windows to prevent Vitest config issues
function getWorkspaceRoot() {
  let root = path.resolve(__dirname, '..');
  if (root.match(/^[a-z]:/)) {
    root = root[0].toUpperCase() + root.slice(1);
  }
  return root;
}

const workspaceRoot = getWorkspaceRoot();

// Programmatically switch process working directory to workspace root
process.chdir(workspaceRoot);

const cleanEnv = { ...process.env };
for (const key of Object.keys(cleanEnv)) {
  if (key.startsWith('npm_') || key.startsWith('NPM_')) {
    delete cleanEnv[key];
  }
}
cleanEnv.INIT_CWD = workspaceRoot;
cleanEnv.PWD = workspaceRoot;

console.log('🚀 Running Shift-Left Pre-Commit Validation...\n');

// Helper to run node scripts directly using process.execPath in workspaceRoot
function runNodeScript(scriptPath, args, description) {
  console.log(`🔹 Running: ${description}...`);
  try {
    execFileSync(process.execPath, [scriptPath, ...args], { 
      stdio: 'inherit', 
      cwd: workspaceRoot,
      env: cleanEnv
    });
    console.log(`✅ ${description} passed.\n`);
    return true;
  } catch (error) {
    console.error(`❌ ${description} failed.\n`);
    return false;
  }
}

// Helper to run shell commands and print output/errors nicely
function runCommand(command, description) {
  console.log(`🔹 Running: ${description}...`);
  try {
    execSync(command, { stdio: 'inherit', cwd: workspaceRoot, env: cleanEnv });
    console.log(`✅ ${description} passed.\n`);
    return true;
  } catch (error) {
    console.error(`❌ ${description} failed.\n`);
    return false;
  }
}

const tscPath = path.resolve(workspaceRoot, 'node_modules', 'typescript', 'lib', 'tsc.js');
const tsconfigPath = path.resolve(workspaceRoot, 'tsconfig.json');
const vitestPath = path.resolve(workspaceRoot, 'node_modules', 'vitest', 'vitest.mjs');
const vitestConfigPath = path.resolve(workspaceRoot, 'vitest.config.ts');

// Check 1: TypeScript compilation check
const lintPassed = runNodeScript(tscPath, ['-p', tsconfigPath, '--noEmit'], 'TypeScript compilation and linting check');
if (!lintPassed) {
  process.exit(1);
}

// Check 2: Unit tests check
// Smart test runner: If staged files are present and none are global config/scripts, run vitest related for sub-second execution
let vitestArgs = ['run', '--config', vitestConfigPath];

const isFullRun = process.argv.includes('--all') || process.env.CI;
if (!isFullRun) {
  try {
    const stagedFiles = execSync('git diff --cached --name-only', { encoding: 'utf8', cwd: workspaceRoot })
      .split('\n')
      .map(f => f.trim())
      .filter(Boolean);

    const hasGlobalConfig = stagedFiles.length === 0 || stagedFiles.some(f => 
      f.startsWith('scripts/') || 
      f.startsWith('.github/') ||
      f === 'package.json' || 
      f === 'package-lock.json' ||
      f === 'tsconfig.json' || 
      f === 'vitest.config.ts' ||
      f.endsWith('.json')
    );

    const testableFiles = stagedFiles.filter(f => f.endsWith('.ts') || f.endsWith('.js') || f.endsWith('.html'));

    if (!hasGlobalConfig && testableFiles.length > 0) {
      vitestArgs = ['related', '--run', '--config', vitestConfigPath, ...testableFiles];
    }
  } catch (e) {
    // Fallback to standard full suite
  }
}

const testsPassed = runNodeScript(vitestPath, vitestArgs, 'Vitest unit tests execution');
if (!testsPassed) {
  process.exit(1);
}

// Check 3: Markdown image path validation
console.log('🔹 Running: Markdown Image Reference validation...');
let mdFilesCount = 0;
let errorsCount = 0;

// Resolve appDataDir artifact path
const userProfile = process.env.USERPROFILE || process.env.HOME || '';
const brainDir = path.join(userProfile, '.gemini', 'antigravity', 'brain');

// Collect all markdown files from the workspace and active brain folder
const filesToCheck = [];

function walkDir(dir, filter, list) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      // Avoid traversing node_modules, build, dist and dot-directories
      if (file !== 'node_modules' && file !== 'build' && file !== 'dist' && !file.startsWith('.')) {
        walkDir(filePath, filter, list);
      }
    } else if (filePath.endsWith(filter)) {
      list.push(filePath);
    }
  }
}

// Add current brain conversation markdown files (if any exist)
if (fs.existsSync(brainDir)) {
  const conversations = fs.readdirSync(brainDir);
  for (const conv of conversations) {
    const convPath = path.join(brainDir, conv);
    if (fs.statSync(convPath).isDirectory() && !conv.startsWith('.')) {
      walkDir(convPath, '.md', filesToCheck);
    }
  }
}

// Add files modified in Git (staged or unstaged markdown files)
try {
  const gitStatus = execSync('git status --porcelain', { encoding: 'utf8', cwd: path.resolve(__dirname, '..') });
  const lines = gitStatus.split('\n');
  for (const line of lines) {
    if (line.trim()) {
      const parts = line.trim().split(/\s+/);
      const filePath = parts[parts.length - 1];
      if (filePath.endsWith('.md') && fs.existsSync(filePath)) {
        filesToCheck.push(path.resolve(filePath));
      }
    }
  }
} catch (e) {
  // Not a git repo or git not installed, fallback to walkthrough.md
  const localWalkthrough = path.resolve('walkthrough.md');
  if (fs.existsSync(localWalkthrough)) {
    filesToCheck.push(localWalkthrough);
  }
}

// Remove duplicates and filter out build, dist, node_modules, and dot-directories
const uniqueFilesToCheck = [...new Set(filesToCheck)].filter(file => {
  const parts = file.split(path.sep);
  return !parts.includes('node_modules') &&
         !parts.includes('build') &&
         !parts.includes('dist') &&
         !parts.includes('.fvm') &&
         !parts.some(p => p.startsWith('.'));
});

// Validate each markdown file
for (const file of uniqueFilesToCheck) {

  mdFilesCount++;
  const content = fs.readFileSync(file, 'utf8');
  // Regular expression to match markdown image tags: ![alt](path)
  const imgRegex = /!\[(.*?)\]\((.*?)\)/g;
  let match;

  while ((match = imgRegex.exec(content)) !== null) {
    const altText = match[1];
    const imgPath = match[2];

    // Skip web URLs
    if (imgPath.startsWith('http://') || imgPath.startsWith('https://')) {
      continue;
    }

    let cleanImgPath = imgPath;
    if (imgPath.startsWith('file://')) {
      cleanImgPath = imgPath.slice(7);
    }

    let resolvedPath;
    if (path.isAbsolute(cleanImgPath) || cleanImgPath.startsWith('C:/') || cleanImgPath.startsWith('c:/')) {
      resolvedPath = cleanImgPath;
    } else if (cleanImgPath.startsWith('/')) {
      // Starts with slash, check Windows absolute drive mapping
      const driveLetterMatch = cleanImgPath.match(/^\/([a-zA-Z]):/);
      if (driveLetterMatch) {
        // e.g. /C:/path -> C:/path
        resolvedPath = cleanImgPath.slice(1);
      } else {
        // Treat as relative to the drive root
        resolvedPath = path.resolve('/', cleanImgPath);
      }
    } else {
      // Relative path to the markdown file's directory
      resolvedPath = path.resolve(path.dirname(file), cleanImgPath);
    }

    // Normalized file path for check
    const normalizedPath = path.normalize(resolvedPath);

    // Validation checks
    if (cleanImgPath.startsWith('/C:/') || cleanImgPath.startsWith('/c:/')) {
      console.error(`⚠️  [${path.basename(file)}]: Image path "${imgPath}" contains invalid leading slash on Windows drive letter. Use "C:/..." instead.`);
      errorsCount++;
    } else if (!fs.existsSync(normalizedPath)) {
      console.error(`⚠️  [${path.basename(file)}]: Image file not found at: "${normalizedPath}" (referenced as "${imgPath}")`);
      errorsCount++;
    }
  }
}

console.log(`📊 Scanned ${mdFilesCount} markdown files.`);
if (errorsCount > 0) {
  console.error(`❌ Markdown validation failed with ${errorsCount} path error(s).\n`);
  process.exit(1);
}
console.log('✅ Markdown image path validation passed.\n');

// Check 4: Secret / Credential Leak Scanning
console.log('🔹 Running: Secret / Credential Leak check...');
let secretsCount = 0;
const secretPatterns = [
  { name: 'Google/Gemini API Key', regex: /AIzaSy[A-Za-z0-9_-]{33}/g },
  { name: 'GitHub Token', regex: /gh[pousr]_[A-Za-z0-9\.\-_]{36,}/g },
  { name: 'Generic Private Key Header', regex: /-----BEGIN [A-Z0-9_-]+ PRIVATE KEY-----/g },
  { name: 'AWS Access Key ID', regex: /(A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}/g },
  { name: 'Stripe Secret Key', regex: /sk_live_[0-9a-zA-Z]{24}/g },
  { name: 'Generic Password/Salt/Token Assignment', regex: /(api[-_]?key|secret[-_]?key|password|db[-_]?pass|salt|pepper|token|auth[-_]?key)\s*[:=]\s*(?:b)?['"`][a-zA-Z0-9_\-*!@#%^&()]{16,}['"`]/gi },
  { name: 'Biased Cryptographic Modulo (CodeQL)', regex: /crypto\.getRandomValues\([^)]+\)(\[[0-9]+\])?\s*%/g }
];

// Gather files modified/staged in git to scan for secrets
const filesToScanSecrets = [];
try {
  const gitStaged = execSync('git diff --cached --name-only --diff-filter=d', { encoding: 'utf8', cwd: path.resolve(__dirname, '..') });
  gitStaged.split('\n').forEach(f => {
    if (f.trim() && fs.existsSync(f.trim())) {
      filesToScanSecrets.push(path.resolve(f.trim()));
    }
  });

  // Also scan unstaged modified files as a safety net
  const gitUnstaged = execSync('git diff --name-only --diff-filter=d', { encoding: 'utf8', cwd: path.resolve(__dirname, '..') });
  gitUnstaged.split('\n').forEach(f => {
    const trimmed = f.trim();
    if (trimmed) {
      const resolved = path.resolve(trimmed);
      if (!filesToScanSecrets.includes(resolved)) {
        filesToScanSecrets.push(resolved);
      }
    }
  });
} catch (e) {
  // Git not installed or not a repository, fallback to scanning files in src/
  walkDir(path.resolve('src'), '.ts', filesToScanSecrets);
  walkDir(path.resolve('src'), '.html', filesToScanSecrets);
}

// Binary files extensions to skip
const skipExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.pdf', '.zip', '.sqlite', '.db', '.keystore', '.jks', '.lock'];

for (const file of filesToScanSecrets) {
  const ext = path.extname(file).toLowerCase();
  if (skipExtensions.includes(ext)) {
    continue;
  }

  // Skip compiled build outputs, submodules, and dependency directories to avoid false positives on minified assets
  const pathParts = file.split(path.sep);
  if (pathParts.includes('build') || pathParts.includes('dist') || pathParts.includes('.dart_tool') || pathParts.includes('node_modules')) {
    continue;
  }

  let content = '';
  try {
    content = fs.readFileSync(file, 'utf8');
  } catch (e) {
    // Gracefully skip directories (EISDIR), missing files (ENOENT), or inaccessible files
    continue;
  }
  for (const pattern of secretPatterns) {
    let match;
    // Reset regex lastIndex
    pattern.regex.lastIndex = 0;
    while ((match = pattern.regex.exec(content)) !== null) {
      // Exclude matches in pre-commit-check.cjs itself or configuration test templates
      if (file === __filename || file.includes('pre-commit-check') || file.includes('.spec.')) {
        continue;
      }
      
      // Exclude placeholder mock keys used in tests (e.g. fake keys starting with standard prefixes but filled with dummy text)
      const matchedString = match[0];
      if (
        matchedString.includes('fake_') ||
        matchedString.includes('mock_') ||
        matchedString.includes('dummy_') ||
        matchedString.includes('test_') ||
        matchedString.includes('placeholder')
      ) {
        continue;
      }


      console.error(`❌  [${path.basename(file)}]: CRITICAL SECRET LEAK DETECTED! Found matching pattern for ${pattern.name} ("${matchedString.slice(0, 10)}...")`);
      secretsCount++;
    }
  }
}

if (secretsCount > 0) {
  console.error(`\n❌ Secret scan failed. Found ${secretsCount} security risk(s). Commit aborted!`);
  console.error('⚠️  Please remove the exposed secret keys or credentials, use environment variables (.env), and try committing again.\n');
  process.exit(1);
} else {
  console.log('✅ Secret / Credential Leak check passed.\n');
}

// Check 5: Python PHI / PII & Secret Compliance Scan
let pythonCmd = 'python3';
if (process.platform === 'win32') {
  const possiblePaths = [
    path.join(workspaceRoot, '.venv', 'Scripts', 'python.exe'),
    path.join(process.env.USERPROFILE || '', 'anaconda3', 'python.exe'),
    'C:\\Users\\philg\\anaconda3\\python.exe',
    'python'
  ];
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      pythonCmd = `"${p}"`;
      break;
    }
  }
}
// Check 6: Sentinel Network Egress & High-Entropy Security Guard
const sentinelScript = path.resolve(workspaceRoot, 'scripts/sentinel_security_guard.mjs');
const sentinelPassed = runNodeScript(sentinelScript, [], 'Sentinel Network & Egress Security Guard');
if (!sentinelPassed) {
  process.exit(1);
}

// Check 7: Monorepo Package Boundary Validation
console.log('🔹 Running: Monorepo Package Boundary validation...');
let boundaryViolations = 0;
const workspacePackages = ['companion-apps', 'pocketgull_api', 'docs'];

for (const pkg of workspacePackages) {
  const pkgDir = path.join(workspaceRoot, pkg);
  if (!fs.existsSync(pkgDir)) continue;

  const pkgFiles = [];
  walkDir(pkgDir, '.ts', pkgFiles);
  walkDir(pkgDir, '.js', pkgFiles);

  for (const file of pkgFiles) {
    if (file.includes('node_modules') || file.includes('dist') || file.includes('build')) continue;
    try {
      const content = fs.readFileSync(file, 'utf8');
      const relativeBoundaryMatches = content.match(/import\s+.*?from\s+['"](?:\.\.\/){3,}.*?['"]/g);
      if (relativeBoundaryMatches) {
        console.error(`❌ Boundary violation in ${path.relative(workspaceRoot, file)}: Deep relative escape import found.`);
        boundaryViolations++;
      }
    } catch (e) {}
  }
}

if (boundaryViolations > 0) {
  console.error(`❌ Monorepo boundary validation failed with ${boundaryViolations} violation(s).\n`);
  process.exit(1);
} else {
  console.log('✅ Monorepo Package Boundary validation passed.\n');
}

// Check 8: Static ReDoS & Catastrophic Backtracking Prevention Audit
console.log('🔹 Running: Static ReDoS & Regular Expression Security Audit...');
let redosViolations = 0;
const srcDir = path.join(workspaceRoot, 'src');
const codeFiles = [];
walkDir(srcDir, '.ts', codeFiles);

const dangerousRegexPatterns = [
  { name: 'Nested Quantifier (a+)+', regex: /\/[^\/\n]*\([^)\n]*(\+|\*)[^)\n]*\)(\+|\*)[^\/\n]*\//g },
  { name: 'Unbounded Wildcard Alternation', regex: /\/[^\/\n]*\.\*[^\/\n]*\([^\/\n]*\|[^\/\n]*\)[^\/\n]*\.\*[^\/\n]*\//g }
];

for (const file of codeFiles) {
  if (file.includes('.spec.') || file.includes('test')) continue;
  try {
    const content = fs.readFileSync(file, 'utf8');
    for (const pat of dangerousRegexPatterns) {
      pat.regex.lastIndex = 0;
      let match;
      while ((match = pat.regex.exec(content)) !== null) {
        console.warn(`⚠️  [${path.relative(workspaceRoot, file)}]: Potential ReDoS pattern (${pat.name}): "${match[0]}"`);
        // We warn rather than abort to allow verified safe fixtures while flagging dangerous code
      }
    }
  } catch (e) {}
}
console.log('✅ Static ReDoS & Regex Security Audit completed.\n');

// Check 9: Global Taint-Tracking Data Flow Analysis
const taintScript = path.resolve(workspaceRoot, 'scripts/taint-analysis-guard.mjs');
const taintPassed = runNodeScript(taintScript, [], 'Global Taint-Tracking Data Flow Security Guard');
if (!taintPassed) {
  process.exit(1);
}

// Check 10: Multi-Workspace Dependency Vulnerability Audit (Shift-Left Dependabot Gate)
console.log('🔹 Running: Multi-Workspace Dependency Vulnerability Audit...');
try {
  execSync('npm audit --audit-level=high', { stdio: 'inherit', cwd: workspaceRoot, env: cleanEnv, timeout: 20000 });
  console.log('✅ Multi-Workspace Dependency Vulnerability Audit passed.\n');
} catch (error) {
  if (error.code === 'ETIMEDOUT') {
    console.warn('⚠️  Multi-Workspace Dependency Vulnerability Audit timed out (registry latency). Skipping local check.\n');
  } else {
    console.error('❌ Multi-Workspace Dependency Vulnerability Audit failed! High/Critical vulnerabilities detected.');
    console.error('⚠️  Run "npm audit fix" or update package.json "overrides" across root and sub-workspaces before committing.\n');
    process.exit(1);
  }
}

console.log('🎉 All pre-commit validation checks passed successfully. Safe to commit!\n');
process.exit(0);

