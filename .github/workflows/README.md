# GitHub Actions Workflows

## Publish Workflow

The `publish.yml` workflow automatically publishes to npm when:
- Changes are pushed to `master` or `main` branch
- The version number in `package.json` has changed

### Setup

1. **Create an npm access token:**
   - Go to https://www.npmjs.com/settings/YOUR_USERNAME/tokens
   - Click "Generate New Token"
   - Select "Automation" type
   - Copy the token

2. **Add the token to GitHub:**
   - Go to your repository settings
   - Navigate to "Secrets and variables" → "Actions"
   - Click "New repository secret"
   - Name: `NPM_TOKEN`
   - Value: Paste your npm token
   - Click "Add secret"

3. **Publishing a new version:**
   - Update the `version` field in `package.json`
   - Commit and push to `master`/`main`
   - The workflow will automatically:
     - Run tests
     - Check if version changed
     - Publish to npm if version changed

### Workflow Steps

1. Checkout code (with previous commit for comparison)
2. Setup Bun
3. Install dependencies
4. Run tests
5. Extract current version from `package.json`
6. Extract previous version from previous commit
7. Compare versions
8. If version changed: Setup Node.js and publish to npm

## CI Workflow

The `ci.yml` workflow runs on all pushes and pull requests to ensure code quality.

