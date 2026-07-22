import { spawnSync } from 'node:child_process';

const env = { ...process.env, PRISMA_CLIENT_ENGINE_TYPE: 'binary' };

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    env,
    shell: true,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

run('npx', ['prisma', 'generate']);
run('npx', ['prisma', 'migrate', 'deploy']);
