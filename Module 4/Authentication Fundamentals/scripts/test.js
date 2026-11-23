const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const projectRoot = path.resolve(__dirname, '..');
const schemaPath = path.join(projectRoot, 'prisma', 'schema.prisma');
const prismaCli = path.join(projectRoot, 'node_modules', 'prisma', 'build', 'index.js');
const testDbPath = path.join(os.tmpdir(), `auth-fundamentals-${process.pid}.db`);
const env = {
  ...process.env,
  DATABASE_URL: `file:${testDbPath.split(path.sep).join('/')}`,
};

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: projectRoot,
    env,
    stdio: 'inherit',
  });
  if (result.error) throw result.error;
  return result.status === null ? 1 : result.status;
}

let exitCode = 0;
try {
  exitCode = run(process.execPath, [prismaCli, 'generate', '--schema', schemaPath]);
  if (exitCode === 0) {
    exitCode = run(process.execPath, [
      prismaCli,
      'db',
      'push',
      '--schema',
      schemaPath,
      '--skip-generate',
    ]);
  }
  if (exitCode === 0) {
    exitCode = run(process.execPath, ['--test', path.join(projectRoot, 'tests', 'auth.test.js')]);
  }
} catch (error) {
  process.stderr.write(`Test setup failed: ${error.message}\n`);
  exitCode = 1;
} finally {
  for (const suffix of ['', '-journal', '-shm', '-wal']) {
    try {
      fs.rmSync(`${testDbPath}${suffix}`, { force: true });
    } catch (error) {
      process.stderr.write(`Could not remove temporary test database: ${error.message}\n`);
      exitCode = 1;
    }
  }
}

process.exitCode = exitCode;
