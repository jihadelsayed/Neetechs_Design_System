/**
 * Local, fail-fast unified-header pilot. Run via npm, with clean main checkouts.
 * Tests temporary clones only. Never publishes, deploys, commits or pushes.
 */
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
if (args.length !== 1 || args[0] === '--help') {
  console.log('Usage: npm run verify:myaccount -- /path/to/Neetechs_Myaccount');
  process.exit(args[0] === '--help' ? 0 : 1);
}
const npmCli = process.env.npm_execpath;
if (!npmCli || !existsSync(npmCli)) {
  throw new Error('Run this script via npm run verify:myaccount.');
}
const designSource = fileURLToPath(new URL('..', import.meta.url));
const accountSource = resolve(args[0]);

function run(command, parameters, cwd, capture = false, env = process.env) {
  console.log('> ' + command + ' ' + parameters.join(' '));
  const result = spawnSync(command, parameters, {
    cwd, env, encoding: 'utf8', stdio: capture ? ['ignore', 'pipe', 'inherit'] : 'inherit',
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(command + ' failed with exit status ' + result.status);
  return capture ? result.stdout.trim() : '';
}
const git = (cwd, ...parameters) => run('git', parameters, cwd, true);
const npm = (cwd, ...parameters) => run(process.execPath, [npmCli, ...parameters], cwd);

function verifySource(source, expectedName) {
  if (!existsSync(join(source, 'package.json'))) throw new Error('Missing package.json: ' + source);
  if (git(source, 'branch', '--show-current') !== 'main') throw new Error('Checkout must be on main: ' + source);
  if (git(source, 'status', '--porcelain')) throw new Error('Checkout must be clean: ' + source);
  const pkg = JSON.parse(readFileSync(join(source, 'package.json'), 'utf8'));
  if (expectedName && pkg.name !== expectedName) throw new Error('Unexpected package: ' + pkg.name);
  return git(source, 'rev-parse', 'HEAD');
}
const designSha = verifySource(designSource, '@neetechs/ui');
const accountSha = verifySource(accountSource);
if (!existsSync(join(accountSource, 'docs/unified-header/myaccount-header-config.ts'))) {
  throw new Error('MyAccount main does not contain the staged header factory. Pull current main first.');
}

const scratch = mkdtempSync(join(tmpdir(), 'neetechs-header-pilot-'));
const design = join(scratch, 'design-system');
const account = join(scratch, 'myaccount');
const artifacts = join(scratch, 'artifacts');
const state = { designSha, accountSha, scratch, completed: [], status: 'running' };
const report = join(scratch, 'pilot-report.json');
const save = () => writeFileSync(report, JSON.stringify(state, null, 2) + '\n');
const step = (name, work) => {
  console.log('\n=== ' + name + ' ===');
  state.current = name;
  save();
  work();
  state.completed.push(name);
  save();
};

try {
  step('Clone exact local main snapshots', () => {
    run('git', ['clone', '--local', '--single-branch', '--branch', 'main', designSource, design], scratch);
    run('git', ['clone', '--local', '--single-branch', '--branch', 'main', accountSource, account], scratch);
    if (git(design, 'rev-parse', 'HEAD') !== designSha || git(account, 'rev-parse', 'HEAD') !== accountSha) {
      throw new Error('Source changed during snapshot; retry with stable checkouts.');
    }
  });
  step('Design system install and full tests', () => {
    npm(design, 'ci');
    npm(design, 'test');
  });
  step('Design system Chromium suite', () => {
    npm(design, 'exec', '--', 'playwright', 'install', 'chromium');
    npm(design, 'run', 'test:browser');
  });
  step('Retain validated npm package', () => {
    npm(design, 'run', 'check:package', '--', '--output-dir', artifacts);
  });
  const version = JSON.parse(readFileSync(join(design, 'package.json'), 'utf8')).version;
  const tarball = join(artifacts, 'neetechs-ui-' + version + '.tgz');
  if (!existsSync(tarball)) throw new Error('Validated tarball not found.');
  state.tarball = tarball;
  // Use the Chromium already installed for Playwright to run Karma.
  const chrome = run(process.execPath, ['--input-type=module', '-e',
    "import { chromium } from '@playwright/test'; console.log(chromium.executablePath());"], design, true);
  if (!existsSync(chrome)) throw new Error('Chromium executable not found: ' + chrome);
  const testAccount = () => run(process.execPath, [npmCli, 'test', '--', '--watch=false', '--browsers=ChromeHeadless'], account, false,
    { ...process.env, CHROME_BIN: chrome });
  step('MyAccount baseline install, tests and build', () => {
    npm(account, 'ci');
    testAccount();
    npm(account, 'run', 'build');
  });
  step('Install checked tarball and activate candidate in temporary copy', () => {
    npm(account, 'install', '--no-save', tarball);
    const installed = JSON.parse(readFileSync(join(account, 'node_modules/@neetechs/ui/package.json'), 'utf8'));
    if (installed.version !== version) throw new Error('Installed package version differs from validated tarball.');
    const dir = join(account, 'src/app/layouts/header');
    const staged = join(account, 'docs/unified-header');
    const wrapper = join(dir, 'header.component.ts');
    const template = join(dir, 'header.component.html');
    const appStyle = join(account, 'src/app/app.component.scss');
    if (!readFileSync(wrapper, 'utf8').includes('DesktopHeaderComponent') ||
        !readFileSync(template, 'utf8').includes('app-mobile-header') ||
        readFileSync(appStyle, 'utf8').includes('Staged cutover rule:')) {
      throw new Error('Unexpected live header or shell baseline; inspect before cutover.');
    }
    for (const file of ['myaccount-unified-header.component.ts', 'myaccount-header-config.ts', 'myaccount-header-config.spec.ts']) {
      cpSync(join(staged, file), join(dir, file), { force: false, errorOnExist: true });
    }
    cpSync(join(design, 'docs/integrations/angular/nt-header.component.ts'),
      join(dir, 'nt-global-header.component.ts'), { force: false, errorOnExist: true });
    writeFileSync(wrapper, [
      "import { Component } from '@angular/core';",
      "import { MyAccountUnifiedHeaderComponent } from './myaccount-unified-header.component';",
      "@Component({ selector: 'app-header', standalone: true,",
      "  imports: [MyAccountUnifiedHeaderComponent], templateUrl: './header.component.html',",
      "  styles: [':host { display: contents; }'],",
      "})",
      "export class HeaderComponent {}",
      '',
    ].join('\n'));
    writeFileSync(template, '<app-unified-header />\n');
    writeFileSync(appStyle, readFileSync(appStyle, 'utf8') + '\n' + readFileSync(join(staged, 'shell-cutover.scss'), 'utf8'));
  });
  step('MyAccount candidate Angular tests and localized production build', () => {
    testAccount();
    npm(account, 'run', 'build');
  });
  state.status = 'build-and-tests-passed';
  delete state.current;
  save();
  console.log('\nAutomated pilot gates passed. Manual browser/auth/SSR parity is still required.');
} catch (error) {
  state.status = 'failed';
  state.error = error instanceof Error ? error.message : String(error);
  save();
  console.error(state.error);
  process.exitCode = 1;
} finally {
  console.log('\nReport: ' + report);
  console.log('Temporary workspace retained for inspection: ' + scratch);
  console.log('No original checkout, npm release, deployment or remote branch was modified.');
}
