# GitHub Actions Workflows

## Publish Workflow

The `publish.yml` workflow automatically publishes to npm when:
- Changes are pushed to `master` or `main` branch
- The version number in `package.json` has changed

### Setup

See [NPM_PUBLISH_SETUP.md](../../NPM_PUBLISH_SETUP.md) for detailed authentication setup instructions.

**Quick Setup:**

1. **Create an npm Automation token:**
   - Go to https://www.npmjs.com/settings/YOUR_USERNAME/tokens
   - Generate "Automation" token
   - Copy the token

2. **Add to GitHub Secrets:**
   - Repository → Settings → Secrets and variables → Actions
   - Add secret: `NPM_TOKEN` with your token

3. **Publishing a new version:**
   - Update the `version` field in `package.json`
   - Commit and push to `master`/`main`
   - The workflow will automatically publish if version changed

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

