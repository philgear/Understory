/**
 * 🛡️ Pocket-Gull Sentinel Security & Egress Guard
 * Custom Step-Security Alternative & Network Boundary Auditor
 *
 * Features:
 * 1. Network Egress Boundary Auditor (Domain Whitelist Verification)
 * 2. Shannon Entropy High-Entropy Token & Secret Detector
 * 3. Multimodal Live Telemetry PHI/PII Guard
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

// Approved Egress Domain Whitelist for Clinical Intelligence & Cloud Engine
const APPROVED_EGRESS_DOMAINS = [
  'generativelanguage.googleapis.com',
  'googleapis.com',
  'cloudrun.app',
  'google.com',
  'ai.google.dev',
  'discuss.ai.google.dev',
  'antigravity.google',
  'antigravity.google.com',
  'anthropic.com',
  'www.anthropic.com',
  'github.com',
  'githubusercontent.com',
  'api.github.com',
  'clamav.net',
  'www.clamav.net',
  'cerner.com',
  'authorization.cerner.com',
  'fhir-myrecord.cerner.com',
  'athenahealth.com',
  'api.platform.athenahealth.com',
  'va.gov',
  'sandbox-api.va.gov',
  'pocketgull.app',
  'www.pocketgull.app',
  'pocketgull.com',
  'www.pocketgull.com',
  'ssa.gov',
  'www.ssa.gov',
  'philgear.biz',
  'www.philgear.biz',
  'geararts.dev',
  'www.geararts.dev',
  'philgearphotography.com',
  'www.philgearphotography.com',
  'matrix.philgear.dev',
  'philgear.dev',
  'doctorswithoutborders.org',
  'www.doctorswithoutborders.org',
  'msf.org',
  'www.msf.org',
  'kaggle.com',
  'www.kaggle.com',
  'cdn.tailwindcss.com',
  'tailwindcss.com',
  'fhir.org',
  'hl7.org',
  'loinc.org',
  'snomed.info',
  'nucc.org',
  'www.nucc.org',
  'schema.org',
  'modelcontextprotocol.io',
  'ec.europa.eu',
  'europa.eu',
  'unitsofmeasure.org',
  'epic.com',
  'fhir.epic.com',
  'ncbi.nlm.nih.gov',
  'nlm.nih.gov',
  'www.nlm.nih.gov',
  'eutils.ncbi.nlm.nih.gov',
  'pubmed.ncbi.nlm.nih.gov',
  'ama-assn.org',
  'www.ama-assn.org',
  'cdc.gov',
  'wwwn.cdc.gov',
  'fda.gov',
  'api.fda.gov',
  'who.int',
  'ghoapi.azureedge.net',
  'azureedge.net',
  'orcid.org',
  'pub.orcid.org',
  'doi.org',
  'hdl.handle.net',
  'guidelinesforcollaboration.info',
  'zenodo.org',
  'clinicaltrials.gov',
  'www.clinicaltrials.gov',
  'trade.gov',
  'hhs.texas.gov',
  'smarthealthit.org',
  'launch.smarthealthit.org',
  'smarthealth.cards',
  'pocketgull.internal',
  'caringinfo.org',
  'www.caringinfo.org',
  'foodwise.org',
  'www.foodwise.org',
  'freewill.com',
  'www.freewill.com',
  'trustandwill.com',
  'developers.zenodo.org',
  'fitbit.com',
  'stripe.com',
  'api.stripe.com',
  'npiregistry.cms.hhs.gov',
  'purl.obolibrary.org',
  'ohsu.edu',
  'www.ohsu.edu',
  'umass.edu',
  'www.umass.edu',
  'ag.umass.edu',
  'tickreport.com',
  'www.tickreport.com',
  'zooniverse.org',
  'www.zooniverse.org',
  'harvard.edu',
  'hms.harvard.edu',
  'undiagnosed.hms.harvard.edu',
  'ga4gh.org',
  'www.ga4gh.org',
  'amazon.com',
  'www.amazon.com',
  'pharmacy.amazon.com',
  'm.media-amazon.com',
  'images-na.ssl-images-amazon.com',
  'images.unsplash.com',
  'cpicpgx.org',
  'aws.amazon.com',
  'amazonaws.com',
  'omronhealthcare.com',
  'cochranelibrary.com',
  'www.cochranelibrary.com',
  'nice.org.uk',
  'www.nice.org.uk',
  'ukrio.org',
  'www.ukrio.org',
  'startalkmedia.com',
  'www.startalkmedia.com',
  'neildegrassetyson.com',
  'www.neildegrassetyson.com',
  'cabreraresearch.org',
  'www.cabreraresearch.org',
  'www.omronhealthcare.com',
  'withings.com',
  'www.withings.com',
  'dexcom.com',
  'www.dexcom.com',
  'kardia.com',
  'www.kardia.com',
  'unencrypted.com',
  'walmart.com',
  'www.walmart.com',
  'i5.walmartimages.com',
  'registry.opendata.aws',
  'healthlake.us-east-1.amazonaws.com',
  'azure.com',
  'azurehealthcareapis.com',
  'azureopendatastorage.blob.core.windows.net',
  'learn.microsoft.com',
  'microsoft.com',
  'msropendata.com',
  'open.fda.gov',
  'fda.gov',
  'apple.com',
  'www.apple.com',
  'developer.apple.com',
  'adobe.com',
  'developer.adobe.com',
  'harvard.edu',
  'hsph.harvard.edu',
  'umich.edu',
  'sph.umich.edu',
  'med.stanford.edu',
  'physionet.org',
  'www.physionet.org',
  'ukbiobank.ac.uk',
  'www.ukbiobank.ac.uk',
  'broadinstitute.org',
  'pan.ukbb.broadinstitute.org',
  'proteinatlas.org',
  'ohif.org',
  'viewer.ohif.org',
  'firebaseapp.com',
  'web.app',
  'reactome.org',
  'santafe.edu',
  'www.santafe.edu',
  'arizona.edu',
  'consciousness.arizona.edu',
  'stanford.edu',
  'hubermanlab.stanford.edu',
  'drmichaellevin.org',
  'www.drmichaellevin.org',
  'mit.edu',
  'biophysics.mit.edu',
  'asu.edu',
  'biodesign.asu.edu',
  'www.asu.edu',
  'uniprot.org',
  'www.uniprot.org',
  'mediawiki.org',
  'www.mediawiki.org',
  'huggingface.co',
  'youtube.com',
  'www.youtube.com',
  'youtu.be',
  'cdn-lfs.huggingface.co',
  'wikimedia.org',
  'upload.wikimedia.org',
  'hooks.slack.com',
  'slack.com',
  'commons.wikimedia.org',
  'porkbun.com',
  'api.porkbun.com',
  'legalzoom.com',
  'www.legalzoom.com',
  'impact.com',
  'app.impact.com',
  'seatgeek.com',
  'developer.seatgeek.com',
  'instagram.com',
  'www.instagram.com',
  'tiktok.com',
  'www.tiktok.com',
  'facebook.com',
  'www.facebook.com',
  'x.com',
  'twitter.com',
  'example.com',
  'astro.build',
  'ieee.org',
  'acm.org',
  'cern.ch',
  'info.cern.ch',
  'opensource.org',
  'unpkg.com',
  'cdn.jsdelivr.net',
  'cdnjs.cloudflare.com',
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'w3.org',
  'meta.com',
  'ai.meta.com',
  'esmatlas.com',
  'walmart.com',
  'www.walmart.com',
  'azurehealthcareapis.com',
  'pocketgull-fhir.azurehealthcareapis.com',
  'unencrypted.com',
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
];

// Directories to scan
const SCAN_DIRECTORIES = ['src', 'public', 'pocketgull_api', 'scripts', 'docs'];

// File extensions to audit
const ALLOWED_EXTENSIONS = ['.ts', '.js', '.mjs', '.cjs', '.py', '.html', '.json'];

// Excluded paths
const IGNORE_PATTERNS = [
  'node_modules',
  'dist',
  'dist-ssr',
  '.git',
  '.venv',
  'python_example_2026',
  'package-lock.json',
  'audit.json',
];

/**
 * Calculate Shannon Entropy of a string
 */
function calculateShannonEntropy(str) {
  if (!str || str.length === 0) return 0;
  const frequencies = {};
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    frequencies[char] = (frequencies[char] || 0) + 1;
  }
  let entropy = 0;
  for (const char in frequencies) {
    const p = frequencies[char] / str.length;
    entropy -= p * Math.log2(p);
  }
  return entropy;
}

/**
 * Scan a single file for network egress and secret entropy
 */
function auditFile(filePath) {
  const relativePath = path.relative(ROOT_DIR, filePath);
  const issues = [];
  const content = fs.readFileSync(filePath, 'utf-8');

  // 1. Audit Network Egress URLs (http://, https://, ws://, wss://)
  const urlRegex = /(?:https?|wss?):\/\/([a-zA-Z0-9.-]+(?:\:[0-9]+)?)/gi;
  let match;
  while ((match = urlRegex.exec(content)) !== null) {
    const domain = match[1].toLowerCase().split(':')[0];
    const isApproved = APPROVED_EGRESS_DOMAINS.some(
      (approved) => domain === approved || domain.endsWith('.' + approved)
    );

    if (!isApproved) {
      issues.push({
        type: 'UNAUTHORIZED_EGRESS_DOMAIN',
        severity: 'HIGH',
        message: `Unapproved external network egress domain detected: "${domain}"`,
        line: content.substring(0, match.index).split('\n').length,
      });
    }
  }

  // 2. Audit High-Entropy Secret Tokens (Length >= 28, Entropy > 4.6)
  const stringLiteralRegex = /(?:"|'|`)([A-Za-z0-9_\-\.\/+=]{28,})(?:"|'|`)/g;
  while ((match = stringLiteralRegex.exec(content)) !== null) {
    const literal = match[1];
    
    // Ignore standard SVG paths, base64 data URLs, public checklist IDs, and import paths
    if (
      literal.startsWith('data:') ||
      literal.includes('M0 ') ||
      literal.includes('L0 ') ||
      literal.startsWith('./') ||
      literal.startsWith('../') ||
      literal.includes('/') ||
      literal.startsWith('___')
    ) {
      continue;
    }

    const entropy = calculateShannonEntropy(literal);
    if (entropy > 4.65) {
      // Check for false positives like UUID placeholders
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(literal)) {
        continue;
      }
      issues.push({
        type: 'HIGH_ENTROPY_SECRET',
        severity: 'CRITICAL',
        message: `High-entropy secret token detected (Entropy: ${entropy.toFixed(2)}): "${literal.substring(0, 8)}..."`,
        line: content.substring(0, match.index).split('\n').length,
      });
    }
  }

  // 2b. Audit GitHub Tokens (ghs_, ghp_, gho_, ghu_, ghr_ - stateless & stateful format)
  const githubTokenRegex = /gh[psuor]_[A-Za-z0-9\.\-_]{36,}/g;
  while ((match = githubTokenRegex.exec(content)) !== null) {
    issues.push({
      type: 'LEAKED_GITHUB_TOKEN',
      severity: 'CRITICAL',
      message: `Hardcoded GitHub Token detected: "${match[0].substring(0, 8)}..."`,
      line: content.substring(0, match.index).split('\n').length,
    });
  }

  // 3. Audit Telemetry Stream Sanitization in Live Multimodal Handlers
  if (
    relativePath.includes('adk-live.service.ts') ||
    relativePath.includes('live-consult') ||
    relativePath.includes('voice-assistant')
  ) {
    if (!content.includes('sanitize') && !content.includes('anonymize') && !content.includes('DOMPurify')) {
      issues.push({
        type: 'MISSING_TELEMETRY_SANITIZER',
        severity: 'MEDIUM',
        message: `Live telemetry stream component does not reference DOMPurify or HIPAA PII sanitization filters.`,
        line: 1,
      });
    }
  }

  // 4. Audit Prohibited Third-Party Agent Harnesses (Google Antigravity Terms §6: OpenClaw, unauthorized OAuth hooks)
  if (!relativePath.includes('sentinel_security_guard')) {
    const prohibitedHarnesses = [
      { pattern: /\bimport\s+.*['"]openclaw['"]/i, name: 'OpenClaw SDK import' },
      { pattern: /\brequire\(['"]openclaw['"]\)/i, name: 'OpenClaw require' },
      { pattern: /\bopenclaw_antigravity_bridge\b/i, name: 'OpenClaw Antigravity Bridge' },
      { pattern: /\bantigravity_oauth_interceptor\b/i, name: 'Antigravity OAuth Interceptor' },
    ];
    for (const check of prohibitedHarnesses) {
      if (check.pattern.test(content)) {
        issues.push({
          type: 'PROHIBITED_AGENT_HARNESS',
          severity: 'CRITICAL',
          message: `Prohibited third-party agent harness detected (${check.name}) per Google Antigravity Terms §6.`,
          line: 1,
        });
      }
    }
  }

  // 5. Audit HIPAA §164.514 Direct Identifiers (Unmasked SSN detection)
  if (!relativePath.includes('sentinel_security_guard') && !relativePath.includes('spec.ts')) {
    const rawSsnRegex = /\b(?!000|666|9\d{2})\d{3}-(?!00)\d{2}-(?!0000)\d{4}\b/g;
    let ssnMatch;
    while ((ssnMatch = rawSsnRegex.exec(content)) !== null) {
      // Allow synthetic zeroes or explicit Safe Harbor placeholders
      if (ssnMatch[0].startsWith('000-00-') || ssnMatch[0] === '123-45-6789') continue;
      issues.push({
        type: 'LEAKED_PHI_IDENTIFIER',
        severity: 'CRITICAL',
        message: `Potential unmasked SSN/Direct Identifier detected: "${ssnMatch[0]}" under HIPAA §164.514 Safe Harbor.`,
        line: content.substring(0, ssnMatch.index).split('\n').length,
      });
    }
  }

  // 6. Kaizen Poka-Yoke: Prohibit untyped 'as any' in Clinical Dosage & Biochemistry Services
  if (
    (relativePath.includes('clinical-biochemistry') ||
      relativePath.includes('rx-guard') ||
      relativePath.includes('pharmacogenomics') ||
      relativePath.includes('precision-nutrition')) &&
    !relativePath.includes('spec.ts')
  ) {
    const looseAnyRegex = /:\s*any\b|\bas\s+any\b/g;
    let anyMatch;
    while ((anyMatch = looseAnyRegex.exec(content)) !== null) {
      issues.push({
        type: 'POKA_YOKE_LOOSE_ANY_TYPE',
        severity: 'HIGH',
        message: `Kaizen Poka-Yoke violation: Untyped 'any' cast detected in clinical dosage service. Use strict domain types.`,
        line: content.substring(0, anyMatch.index).split('\n').length,
      });
    }
  }

  return issues;
}

/**
 * Traverse directories recursively
 */
function walkDirectory(dirPath) {
  let fileList = [];
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    const relativePath = path.relative(ROOT_DIR, fullPath);

    if (IGNORE_PATTERNS.some((pattern) => relativePath.includes(pattern))) {
      continue;
    }

    if (entry.isDirectory()) {
      fileList = fileList.concat(walkDirectory(fullPath));
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (ALLOWED_EXTENSIONS.includes(ext)) {
        fileList.push(fullPath);
      }
    }
  }

  return fileList;
}

/**
 * Run Sentinel Audit Suite
 */
function runSentinelGuard() {
  console.log('\n🛡️  Running Sentinel Security & Egress Guard...\n');

  let totalFilesScanned = 0;
  const allIssues = [];

  for (const targetDir of SCAN_DIRECTORIES) {
    const fullDir = path.join(ROOT_DIR, targetDir);
    if (!fs.existsSync(fullDir)) continue;

    const files = walkDirectory(fullDir);
    for (const file of files) {
      totalFilesScanned++;
      const fileIssues = auditFile(file);
      if (fileIssues.length > 0) {
        allIssues.push({
          file: path.relative(ROOT_DIR, file),
          issues: fileIssues,
        });
      }
    }
  }

  console.log(`📊 Scanned ${totalFilesScanned} source files for egress and secret security.`);

  if (allIssues.length === 0) {
    console.log('✅ [PASS] Sentinel Security Guard passed. All network egress domains approved and 0 secret leaks found.\n');
    process.exit(0);
  } else {
    console.error('\n❌ [FAIL] Sentinel Security Guard detected potential risks:');
    for (const fileGroup of allIssues) {
      console.error(`\n📄 ${fileGroup.file}:`);
      for (const issue of fileGroup.issues) {
        console.error(`  - [${issue.severity}] Line ${issue.line}: ${issue.message}`);
      }
    }
    console.error('\n⚠️  Please review network egress domains and secret tokens before committing.\n');
    process.exit(1);
  }
}

runSentinelGuard();
