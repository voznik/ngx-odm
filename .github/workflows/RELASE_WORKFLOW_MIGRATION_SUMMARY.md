# Migration Summary: Native NX Release

## What Changed

### ✅ Completed

1. **Updated `nx.json`**
   - Added comprehensive `release` configuration
   - Enabled conventional commits
   - Configured GitHub releases integration
   - Set pre-release identifier to `dev`

2. **Updated `package.json`**
   - Removed `@jscutlery/semver` dependency
   - Added new release scripts
   - Added act testing scripts

3. **Updated `packages/rxdb/project.json`**
   - Removed old `version` and `github` targets
   - Native NX release will handle this automatically

4. **New GitHub Actions Workflow**
   - Created `.github/workflows/release.yaml` (simplified)
   - Backed up old workflow to `release.yaml.old`
   - Automatic npm publishing on tag push
   - Automatic GitHub releases
   - Automatic docs deployment (regular releases only)

5. **Act Configuration**
   - Created `.actrc` for act settings
   - Created `.act.env` for environment variables
   - Created `.secrets.template` as a template
   - Updated `.gitignore` to exclude secrets

6. **Documentation**
   - Created `RELEASE.md` with complete release process
   - Created this migration summary

## Next Steps

### 1. Install Dependencies

Remove the old semver package:

```bash
npm install
```

This will automatically remove `@jscutlery/semver` since it's no longer in package.json.

### 2. Test the New Setup (Dry Run)

Preview what a release would look like:

```bash
npm run release:dry
```

This shows you:

- What version would be created
- What changes would be made
- Whether tests/builds pass

### 3. Install Act (Optional, for Local Testing)

When you're ready to test workflows locally:

```bash
# Arch Linux
yay -S act

# Then set up secrets
cp .secrets.template .secrets
# Edit .secrets with your actual tokens

# Test the workflow
npm run act:release:dry
```

### 4. Create Your First Release

When ready to do an actual release:

```bash
# For a pre-release (publishes with -dev suffix to npm 'dev' tag)
npm run release:prerelease

# For a patch release (publishes to npm 'latest' tag)
npm run release:patch

# Review the changes
git log -1
git tag -l | tail -1

# Push (this triggers CI to publish)
git push && git push --tags
```

## Pre-Release Workflow

### Pre-release WITHOUT docs

```bash
# Create pre-release
npm run release:prerelease
# This creates: v1.0.0-dev.0

# Push
git push && git push --tags

# CI automatically:
# - Detects it's a pre-release (has '-dev')
# - Publishes to npm with 'dev' tag
# - Creates GitHub pre-release
# - Skips docs deployment

# Users install with:
npm install @ngx-odm/rxdb@dev
```

### Pre-release WITH docs

```bash
# Create pre-release with docs marker
npm run release:prerelease:docs
# This creates: v1.0.0-dev.0 with commit message ending in "(+docs)"

# Push
git push && git push --tags

# CI automatically:
# - Detects it's a pre-release (has '-dev')
# - Detects (+docs) marker in commit message
# - Publishes to npm with 'dev' tag
# - Creates GitHub pre-release
# - **Deploys documentation to GitHub Pages**
```

## Regular Release Workflow

```bash
# Create release
npm run release:patch  # or minor/major
# This creates: v1.0.0

# Push
git push && git push --tags

# CI automatically:
# - Detects it's a regular release
# - Publishes to npm with 'latest' tag
# - Creates GitHub release
# - Deploys documentation to gh-pages

# Users install with:
npm install @ngx-odm/rxdb
# or
npm install @ngx-odm/rxdb@latest
```

## Verifying the Setup

### Check NX Release Configuration

```bash
# See the resolved configuration
npx nx release --print-config
```

### Check Available Workflows

```bash
# List act workflows (after installing act)
npm run act:list
```

### Check GitHub Pages

Your docs deployment is working correctly:

- URL: https://voznik.github.io/ngx-odm/
- Method: Modern GitHub Actions deployment (no branch switching)
- Trigger: Automatically on regular releases

## Rollback Plan

If you need to rollback to the old system:

1. Restore old workflow:

   ```bash
   mv .github/workflows/release.yaml.old .github/workflows/release.yaml
   ```

2. Restore old project.json:

   ```bash
   git checkout HEAD -- packages/rxdb/project.json
   ```

3. Reinstall @jscutlery/semver:

   ```bash
   npm install -D @jscutlery/semver@5.7.1
   ```

4. Restore old nx.json release config:
   ```bash
   git checkout HEAD -- nx.json
   ```

## Benefits of the New Setup

| Feature             | Old (@jscutlery/semver)    | New (NX Release)       |
| ------------------- | -------------------------- | ---------------------- |
| **Simplicity**      | Separate package to manage | Native NX feature      |
| **Commands**        | `nx run rxdb:version`      | `nx release`           |
| **Pre-releases**    | Manual configuration       | Built-in `--preid=dev` |
| **GitHub Releases** | Separate target            | Automatic              |
| **Local Testing**   | Not available              | Full act support       |
| **Configuration**   | Spread across files        | Centralized in nx.json |
| **Workflows**       | Complex (100+ lines)       | Simple (80 lines)      |
| **Maintenance**     | Third-party package        | First-party NX         |

## Questions?

See `RELEASE.md` for the complete release process documentation.

For NX Release features, see: https://nx.dev/features/manage-releases
