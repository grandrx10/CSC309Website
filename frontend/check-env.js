const { exec } = require('child_process');

exec('npm --version', (error, stdout, stderr) => {
  if (error || stderr) {
    console.error(`Error: ${stderr || error.message}`);
  } else {
    console.log(`npm version: ${stdout}`);
  }
});