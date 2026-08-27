const { spawn } = require('child_process');

const environments = ['production', 'preview', 'development'];
const url = 'https://openlysts.dpdns.org';

async function setEnv(envName) {
  return new Promise((resolve, reject) => {
    const child = spawn('npx', ['vercel', 'env', 'add', 'APP_URL', envName], {
      stdio: ['pipe', 'inherit', 'inherit'],
      shell: true
    });
    
    child.stdin.write(url);
    child.stdin.end();

    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Failed for ${envName}`));
    });
  });
}

async function run() {
  for (const env of environments) {
    console.log(`Setting for ${env}...`);
    await setEnv(env);
  }
}

run().catch(console.error);
