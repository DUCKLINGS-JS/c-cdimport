#!/usr/bin/env node
// duckling.js — SΩ-ENGINE Package Manager
// Commands:
//   node duckling.js cimport "name,exports=[a,b,c],requires=[basics],version=1.0"
//   node duckling.js cdimport "github.com/user/cimport"
//   node duckling.js key "YOUR_GITHUB_TOKEN"

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');

const CONFIG_FILE = path.join(process.cwd(), '.duckling_config.json');

// ─────────────────────────────────────────
//  CONFIG (stores GitHub key)
// ─────────────────────────────────────────
const loadConfig = () => {
    if (!fs.existsSync(CONFIG_FILE)) return {};
    return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
};

const saveConfig = (cfg) => {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2));
    console.log('\x1b[32m[duckling]\x1b[0m Config saved.');
};

// ─────────────────────────────────────────
//  GITHUB API HELPER
// ─────────────────────────────────────────
const githubAPI = (method, endpoint, token, data) => new Promise((resolve, reject) => {
    const body = data ? JSON.stringify(data) : null;
    const options = {
        hostname: 'api.github.com',
        path: endpoint,
        method,
        headers: {
            'User-Agent': 'duckling-package-manager',
            'Authorization': `token ${token}`,
            'Content-Type': 'application/json',
            ...(body ? { 'Content-Length': Buffer.byteLength(body) } : {})
        }
    };
    const req = https.request(options, (res) => {
        let raw = '';
        res.on('data', d => raw += d);
        res.on('end', () => {
            try { resolve({ status: res.statusCode, data: JSON.parse(raw) }); }
            catch { resolve({ status: res.statusCode, data: raw }); }
        });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
});

// ─────────────────────────────────────────
//  GENERATE SITE (index.html)
// ─────────────────────────────────────────
const generateSite = (module) => `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${module.name} — SΩ Package</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;700;800&display=swap');
  :root {
    --bg: #0a0a0f;
    --surface: #111118;
    --border: #2a2a3a;
    --accent: #7c6af7;
    --accent2: #f76a8a;
    --text: #e8e8f0;
    --muted: #6a6a8a;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: var(--bg); color: var(--text); font-family: 'Space Mono', monospace; min-height: 100vh; }
  .hero { padding: 80px 40px 60px; border-bottom: 1px solid var(--border); position: relative; overflow: hidden; }
  .hero::before { content: 'SΩ'; position: absolute; right: -20px; top: -40px; font-family: 'Syne', sans-serif; font-size: 200px; font-weight: 800; opacity: 0.04; color: var(--accent); pointer-events: none; }
  .badge { display: inline-block; background: var(--accent); color: white; font-size: 11px; padding: 3px 10px; border-radius: 2px; margin-bottom: 20px; letter-spacing: 2px; text-transform: uppercase; }
  h1 { font-family: 'Syne', sans-serif; font-size: clamp(2.5rem, 6vw, 5rem); font-weight: 800; line-height: 1; margin-bottom: 16px; }
  h1 span { color: var(--accent); }
  .version { color: var(--muted); font-size: 13px; margin-bottom: 30px; }
  .install-box { background: var(--surface); border: 1px solid var(--border); border-left: 3px solid var(--accent); padding: 16px 20px; border-radius: 4px; display: inline-block; }
  .install-box code { color: var(--accent2); font-size: 14px; }
  .content { max-width: 900px; margin: 0 auto; padding: 60px 40px; }
  .section { margin-bottom: 50px; }
  .section h2 { font-family: 'Syne', sans-serif; font-size: 1.4rem; font-weight: 700; margin-bottom: 20px; color: var(--accent); border-bottom: 1px solid var(--border); padding-bottom: 10px; }
  .exports-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px; }
  .export-chip { background: var(--surface); border: 1px solid var(--border); border-radius: 4px; padding: 12px 16px; font-size: 13px; transition: border-color 0.2s; }
  .export-chip:hover { border-color: var(--accent); }
  .export-chip .fn-name { color: var(--accent2); font-weight: 700; margin-bottom: 4px; }
  .export-chip .fn-type { color: var(--muted); font-size: 11px; }
  .requires-list { display: flex; flex-wrap: wrap; gap: 8px; }
  .req-tag { background: var(--surface); border: 1px solid var(--border); border-radius: 2px; padding: 6px 14px; font-size: 12px; color: var(--muted); }
  .usage-block { background: var(--surface); border: 1px solid var(--border); border-radius: 4px; padding: 24px; }
  .usage-block code { display: block; font-size: 13px; line-height: 2; color: var(--text); }
  .usage-block .comment { color: var(--muted); }
  .usage-block .kw { color: var(--accent); }
  .usage-block .str { color: var(--accent2); }
  .footer { border-top: 1px solid var(--border); padding: 30px 40px; text-align: center; color: var(--muted); font-size: 12px; }
</style>
</head>
<body>
<div class="hero">
  <div style="max-width:900px;margin:0 auto;">
    <div class="badge">SΩ Package</div>
    <h1><span>${module.name}</span></h1>
    <div class="version">v${module.version} · ${module.exports.length} exports · requires: ${module.requires.join(', ')}</div>
    <div class="install-box">
      <code>cdimport"github.com/${module.author || 'user'}/cimport"</code>
    </div>
  </div>
</div>
<div class="content">
  <div class="section">
    <h2>Exports</h2>
    <div class="exports-grid">
      ${module.exports.map(fn => `
      <div class="export-chip">
        <div class="fn-name">${fn}</div>
        <div class="fn-type">function</div>
      </div>`).join('')}
    </div>
  </div>
  <div class="section">
    <h2>Requires</h2>
    <div class="requires-list">
      ${module.requires.map(r => `<div class="req-tag">${r}</div>`).join('')}
    </div>
  </div>
  <div class="section">
    <h2>Usage</h2>
    <div class="usage-block">
      <code><span class="comment">// In your .ducklings file</span></code>
      <code><span class="kw">Hardify</span>=false</code>
      <code><span class="kw">Import</span><span class="str">"basics"</span></code>
      <code><span class="kw">cdimport</span><span class="str">"github.com/${module.author || 'user'}/cimport"</span></code>
      ${module.exports.slice(0, 3).map(fn => `<code><span class="kw">Call</span><span class="str">"${fn}"</span></code>`).join('')}
    </div>
  </div>
</div>
<div class="footer">
  SΩ-ENGINE · Built with .ducklings · <a href="https://github.com/${module.author || 'user'}/cimport" style="color:#7c6af7;">GitHub</a>
</div>
</body>
</html>`;

// ─────────────────────────────────────────
//  GENERATE README
// ─────────────────────────────────────────
const generateReadme = (module) => `# ${module.name}
> SΩ-ENGINE module · v${module.version}

## Install
\`\`\`
cdimport"github.com/${module.author || 'user'}/cimport"
\`\`\`

## Exports
${module.exports.map(fn => `- \`${fn}\``).join('\n')}

## Requires
${module.requires.map(r => `- \`${r}\``).join('\n')}

## Usage
\`\`\`
Hardify=false
Import"basics"
cdimport"github.com/${module.author || 'user'}/cimport"
${module.exports.slice(0, 3).map(fn => `Call"${fn}"`).join('\n')}
\`\`\`

---
*Generated by duckling package manager · SΩ-ENGINE*
`;

// ─────────────────────────────────────────
//  PARSE CIMPORT STRING
// ─────────────────────────────────────────
const parseCimport = (str) => {
    const nameMatch = str.match(/^([^,]+)/);
    const exportsMatch = str.match(/exports=\[([^\]]+)\]/);
    const requiresMatch = str.match(/requires=\[([^\]]+)\]/);
    const versionMatch = str.match(/version=([\d.]+)/);
    return {
        name: nameMatch ? nameMatch[1].trim() : 'unnamed',
        exports: exportsMatch ? exportsMatch[1].split(',').map(s => s.trim()) : [],
        requires: requiresMatch ? requiresMatch[1].split(',').map(s => s.trim()) : [],
        version: versionMatch ? versionMatch[1] : '1.0',
    };
};

// ─────────────────────────────────────────
//  COMMANDS
// ─────────────────────────────────────────
const commands = {

    // Set GitHub token
    key: (token) => {
        if (!token) { console.log('\x1b[31m[duckling]\x1b[0m Usage: node duckling.js key "YOUR_GITHUB_TOKEN"'); return; }
        const cfg = loadConfig();
        cfg.token = token;
        cfg.set_at = new Date().toISOString();
        saveConfig(cfg);
        console.log('\x1b[32m[duckling]\x1b[0m GitHub token saved! You can now use cimport and cdimport.');
    },

    // Create module + push to GitHub cimport repo
    cimport: async (input) => {
        if (!input) { console.log('\x1b[31m[duckling]\x1b[0m Usage: node duckling.js cimport "name,exports=[a,b],requires=[basics],version=1.0"'); return; }

        const cfg = loadConfig();
        if (!cfg.token) {
            console.log('\x1b[31m[duckling]\x1b[0m ⚠️  GitHub token required!');
            console.log('\x1b[33m[duckling]\x1b[0m Run: node duckling.js key "YOUR_GITHUB_TOKEN"');
            console.log('\x1b[33m[duckling]\x1b[0m Get a token at: github.com/settings/tokens');
            return;
        }

        const module = parseCimport(input);
        console.log(`\x1b[36m[duckling]\x1b[0m Creating module: ${module.name} v${module.version}`);
        console.log(`\x1b[36m[duckling]\x1b[0m Exports: [${module.exports.join(', ')}]`);
        console.log(`\x1b[36m[duckling]\x1b[0m Requires: [${module.requires.join(', ')}]`);

        // Get GitHub username
        const userRes = await githubAPI('GET', '/user', cfg.token);
        if (userRes.status !== 200) { console.log('\x1b[31m[duckling]\x1b[0m Invalid token or GitHub error'); return; }
        const username = userRes.data.login;
        module.author = username;

        // Check if cimport repo exists, create if not
        const repoRes = await githubAPI('GET', `/repos/${username}/cimport`, cfg.token);
        if (repoRes.status === 404) {
            console.log('\x1b[36m[duckling]\x1b[0m Creating "cimport" repo on GitHub...');
            await githubAPI('POST', '/user/repos', cfg.token, {
                name: 'cimport',
                description: 'SΩ-ENGINE module registry',
                auto_init: true,
                private: false
            });
            console.log('\x1b[32m[duckling]\x1b[0m Repo created: github.com/' + username + '/cimport');
        }

        // Generate files
        const importMakerContent = [
            `// ${module.name}.import_maker — SΩ-ENGINE module`,
            `name: "${module.name}"`,
            `exports: [${module.exports.join(', ')}]`,
            `requires: [${module.requires.join(', ')}]`,
            `version: ${module.version}`,
            `author: ${username}`,
            `created: ${new Date().toISOString()}`,
        ].join('\n');

        const siteContent = generateSite(module);
        const readmeContent = generateReadme(module);

        // Save locally
        const localDir = path.join(process.cwd(), module.name);
        if (!fs.existsSync(localDir)) fs.mkdirSync(localDir, { recursive: true });
        fs.writeFileSync(path.join(localDir, `${module.name}.import_maker`), importMakerContent);
        fs.writeFileSync(path.join(localDir, 'index.html'), siteContent);
        fs.writeFileSync(path.join(localDir, 'README.md'), readmeContent);
        console.log(`\x1b[32m[duckling]\x1b[0m Files created locally in ./${module.name}/`);

        // Push to GitHub via API
        const toBase64 = (str) => Buffer.from(str).toString('base64');
        const commitMsg = `feat: add ${module.name} v${module.version}`;

        const filesToPush = [
            { path: `${module.name}/${module.name}.import_maker`, content: importMakerContent },
            { path: `${module.name}/index.html`, content: siteContent },
            { path: `${module.name}/README.md`, content: readmeContent },
        ];

        for (const file of filesToPush) {
            // Check if file exists to get SHA for update
            const existing = await githubAPI('GET', `/repos/${username}/cimport/contents/${file.path}`, cfg.token);
            const payload = {
                message: commitMsg,
                content: toBase64(file.content),
                ...(existing.status === 200 ? { sha: existing.data.sha } : {})
            };
            await githubAPI('PUT', `/repos/${username}/cimport/contents/${file.path}`, cfg.token, payload);
        }

        console.log('\x1b[32m[duckling]\x1b[0m ✓ Pushed to GitHub!');
        console.log(`\x1b[36m[duckling]\x1b[0m Repo: https://github.com/${username}/cimport`);
        console.log(`\x1b[36m[duckling]\x1b[0m Site: https://${username}.github.io/cimport/${module.name}/`);
        console.log(`\x1b[33m[duckling]\x1b[0m Others can install with: cdimport"github.com/${username}/cimport"`);
    },

    // Install from GitHub cimport repo
    cdimport: async (repoUrl) => {
        if (!repoUrl) { console.log('\x1b[31m[duckling]\x1b[0m Usage: node duckling.js cdimport "github.com/user/cimport"'); return; }

        const cfg = loadConfig();
        const cleanUrl = repoUrl.replace('github.com/', '').replace('https://', '');
        const [owner, repo] = cleanUrl.split('/');

        console.log(`\x1b[36m[duckling]\x1b[0m Installing from ${owner}/${repo}...`);

        // List all modules in the repo
        const token = cfg.token || '';
        const contentsRes = await githubAPI('GET', `/repos/${owner}/${repo}/contents`, token);
        if (contentsRes.status !== 200) { console.log('\x1b[31m[duckling]\x1b[0m Repo not found or private'); return; }

        const modules = contentsRes.data.filter(item => item.type === 'dir');
        if (modules.length === 0) { console.log('\x1b[31m[duckling]\x1b[0m No modules found in repo'); return; }

        const installDir = path.join(process.cwd(), '.duckling_modules');
        if (!fs.existsSync(installDir)) fs.mkdirSync(installDir, { recursive: true });

        for (const mod of modules) {
            // Get the .import_maker file
            const modContents = await githubAPI('GET', `/repos/${owner}/${repo}/contents/${mod.name}`, token);
            if (modContents.status !== 200) continue;

            const importMakerFile = modContents.data.find(f => f.name.endsWith('.import_maker'));
            if (!importMakerFile) continue;

            const fileRes = await githubAPI('GET', `/repos/${owner}/${repo}/contents/${mod.name}/${importMakerFile.name}`, token);
            if (fileRes.status !== 200) continue;

            const content = Buffer.from(fileRes.data.content, 'base64').toString('utf8');
            fs.writeFileSync(path.join(installDir, importMakerFile.name), content);
            console.log(`\x1b[32m[duckling]\x1b[0m ✓ Installed: ${mod.name}`);
        }

        console.log('\x1b[32m[duckling]\x1b[0m All modules installed to .duckling_modules/');
        console.log('\x1b[33m[duckling]\x1b[0m Use Import"moduleName" in your .ducklings files');
    },

    // List installed modules
    list: () => {
        const installDir = path.join(process.cwd(), '.duckling_modules');
        if (!fs.existsSync(installDir)) { console.log('\x1b[33m[duckling]\x1b[0m No modules installed yet'); return; }
        const files = fs.readdirSync(installDir).filter(f => f.endsWith('.import_maker'));
        if (files.length === 0) { console.log('\x1b[33m[duckling]\x1b[0m No modules installed yet'); return; }
        console.log('\x1b[36m[duckling]\x1b[0m Installed modules:');
        files.forEach(f => {
            const content = fs.readFileSync(path.join(installDir, f), 'utf8');
            const nameMatch = content.match(/name: "([^"]+)"/);
            const versionMatch = content.match(/version: ([\d.]+)/);
            console.log(`  · ${nameMatch?.[1] || f} v${versionMatch?.[1] || '?'}`);
        });
    },

    // Install cimport/cdimport tools from official repo
    install: async (tool) => {
        if (!tool) {
            console.log('\x1b[31m[duckling]\x1b[0m Usage: node duckling.js install cimport');
            console.log('\x1b[31m[duckling]\x1b[0m Usage: node duckling.js install cdimport');
            return;
        }

        const TOOLS_REPO = 'DUCKLINGS-JS/c-cdimport';
        const RAW_URL = `https://raw.githubusercontent.com/${TOOLS_REPO}/main/duckling.js`;

        console.log(`\x1b[36m[duckling]\x1b[0m Fetching latest ${tool} from ${TOOLS_REPO}...`);

        const file = await new Promise((resolve, reject) => {
            https.get(RAW_URL, (res) => {
                let data = '';
                res.on('data', d => data += d);
                res.on('end', () => resolve({ status: res.statusCode, data }));
            }).on('error', reject);
        });

        if (file.status !== 200) {
            console.log(`\x1b[31m[duckling]\x1b[0m Failed to fetch — status ${file.status}`);
            return;
        }

        const toolsDir = path.join(process.cwd(), '.duckling_tools');
        if (!fs.existsSync(toolsDir)) fs.mkdirSync(toolsDir, { recursive: true });

        const outPath = path.join(toolsDir, `${tool}.js`);
        fs.writeFileSync(outPath, file.data);
        console.log(`\x1b[32m[duckling]\x1b[0m ✓ ${tool} installed to .duckling_tools/${tool}.js`);
        console.log(`\x1b[33m[duckling]\x1b[0m Run with: node .duckling_tools/${tool}.js`);
    },

    help: () => {
        console.log(`
\x1b[36mduckling — SΩ-ENGINE Package Manager\x1b[0m

Commands:
  node duckling.js install cimport          Install cimport from official repo
  node duckling.js install cdimport         Install cdimport from official repo
  node duckling.js key "<token>"            Set GitHub token (required for cimport)
  node duckling.js cimport "<definition>"   Create and publish a module
  node duckling.js cdimport "<github url>"  Install modules from GitHub
  node duckling.js list                     List installed modules
  node duckling.js help                     Show this message

cimport format:
  "name,exports=[fn1,fn2,fn3],requires=[basics,UI],version=1.0"

Official tools repo:
  github.com/DUCKLINGS-JS/c-cdimport

Get a GitHub token:
  github.com/settings/tokens → Generate new token → repo scope
        `);
    }
};

// ─────────────────────────────────────────
//  RUN
// ─────────────────────────────────────────
(async () => {
    console.log('\x1b[36mduckling v1.0\x1b[0m — SΩ-ENGINE Package Manager\n');

    const cmd = process.argv[2];
    const arg = process.argv[3];

    if (!cmd || cmd === 'help') { commands.help(); return; }
    if (cmd === 'key') { commands.key(arg); return; }
    if (cmd === 'list') { commands.list(); return; }
    if (cmd === 'install') { await commands.install(arg); return; }
    if (cmd === 'cimport') { await commands.cimport(process.argv.slice(3).join(' ')); return; }
    if (cmd === 'cdimport') { await commands.cdimport(arg); return; }

    console.log(`\x1b[31m[duckling]\x1b[0m Unknown command: ${cmd}`);
    commands.help();
})();
