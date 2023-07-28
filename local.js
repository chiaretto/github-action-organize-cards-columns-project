require('dotenv').config();

const idx = require("./index");

const inputs = {
    token: process.env.GITHUB_TOKEN,
    debug: 'false',
    owner: process.env.GITHUB_OWNER,
    repo: process.env.GITHUB_REPO,
    allowedRepos: 'product-roadmap'
  };

if (process.env.local) {
  console.log('running local');
  idx.processWithInputs(inputs)
}