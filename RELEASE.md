# Release Process

This project uses **native NX Release** for managing versions, changelogs, and publishing.

## Overview

The release process is simplified into two main workflows:

1. **Local**: Create version, changelog, and git tag locally using `nx release`
2. **CI**: Push tags to GitHub, which triggers automated npm publishing

## Release Types

### Regular Releases (v1.0.0, v1.1.0, v1.0.1)

Regular releases are published to npm with the `latest` tag.

```bash
# Patch release (bug fixes)
npm run release:patch

# Minor release (new features, backward compatible)
npm run release:minor

# Major release (breaking changes)
npm run release:major
```

### Pre-Releases (v1.0.0-dev.0, v1.0.0-dev.1)

Pre-releases are published to npm with the `dev` tag.

```bash
# Create a pre-release (without docs deployment)
npm run release:prerelease

# Create a pre-release WITH docs deployment
npm run release:prerelease:docs
```

The `:docs` variant automatically appends `(+docs)` to the commit message, which triggers documentation deployment when you push.

## Step-by-Step Release Process

### 1. Prepare Your Changes

Ensure all changes are committed and pushed to master:

```bash
git checkout master
git pull origin master
```

Verify your commits follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` for new features (minor bump)
- `fix:` for bug fixes (patch bump)
- `feat!:` or `BREAKING CHANGE:` for breaking changes (major bump)

### 2. Preview the Release (Dry Run)

Always preview before releasing:

```bash
# See what would happen
npm run release:dry

# Or manually specify the version
npx nx release --dry-run --specifier=1.2.3
```

This shows:

- Which version will be created
- Which files will be changed
- What the changelog will contain
- Whether tests/builds pass

### 3. Create the Release Locally

Run the appropriate release command:

```bash
# Automatic version based on conventional commits
npm run release

# Or specify version type manually
npm run release:patch   # 1.0.0 → 1.0.1
npm run release:minor   # 1.0.0 → 1.1.0
npm run release:major   # 1.0.0 → 2.0.0

# Or pre-release
npm run release:prerelease  # 1.0.0 → 1.0.0-dev.0
```

This will:

1. Run tests and build (via `preVersionCommand`)
2. Determine the new version
3. Update package.json files
4. Generate CHANGELOG.md
5. Create a git commit
6. Create a git tag (e.g., v1.2.3)
7. **NOT publish** (due to `--skip-publish` flag)

### 4. Review and Push

Review the changes:

```bash
# Check the commit
git log -1

# Check the tag
git tag -l | tail -1

# Check the changelog
cat packages/rxdb/CHANGELOG.md
```

If everything looks good, push:

```bash
# Push commits and tags
git push && git push --tags
```

**IMPORTANT**: Pushing the tag triggers the CI workflow that publishes to npm!

### 5. CI Publishes Automatically

Once you push the tag, the GitHub Actions workflow (`.github/workflows/release.yaml`) automatically:

1. ✅ Detects if it's a regular release or pre-release
2. ✅ Builds the library
3. ✅ Publishes to npm with the correct tag (`latest` or `dev`)
4. ✅ Creates a GitHub Release
5. ✅ Deploys documentation (regular releases only)

Monitor the workflow:

```bash
# Watch the release workflow
gh workflow view release.yaml

# Or visit GitHub Actions in your browser
```

## Pre-Release to Release Promotion

To promote a pre-release to a stable release:

```bash
# If current version is 1.0.0-dev.0, release 1.0.0
npm run release:patch  # or minor/major as appropriate
```

NX Release automatically handles removing the `-dev` suffix.

## Deploying Documentation for Pre-Releases

By default, documentation is only deployed for regular releases. To deploy documentation for a pre-release, you have several options:

### Option 1: Automatic via Commit Message (Recommended)

Use the special `:docs` script variant that adds the `(+docs)` marker:

```bash
# Create pre-release with docs deployment
npm run release:prerelease:docs

# Review and push
git push && git push --tags
```

The `(+docs)` marker in the commit message automatically triggers docs deployment when the tag is pushed.

### Option 2: Manual Commit Amendment

If you already created a release without docs, amend the commit:

```bash
# Add (+docs) marker to existing release commit
npm run release:amend:docs

# Force push the amended commit and tag
git push --force-with-lease && git push --tags --force
```

### Option 3: Using GitHub UI

1. Go to Actions → Release & Publish → Run workflow
2. Enter the tag name (e.g., `v7.0.0-dev.1`)
3. Check "Deploy documentation to GitHub Pages"
4. Click "Run workflow"

### Option 4: Using GitHub CLI

```bash
# After creating the pre-release tag
gh workflow run release.yaml \
  --field tag=v7.0.0-dev.1 \
  --field deploy_docs=true
```

### How it Works

The workflow checks for docs deployment in this priority order:

1. **Workflow input** (`deploy_docs` parameter)
2. **Commit message marker** (`(+docs)` in the release commit)
3. **Release type** (always deploy for regular releases, skip for pre-releases)

## Local Testing (with act)

After installing `act`, you can test the release workflow locally:

### Setup (One-time)

1. Install act:

   ```bash
   # Arch Linux
   yay -S act

   # Or via Go
   go install github.com/nektos/act@latest
   ```

2. Create `.secrets` file from template:
   ```bash
   cp .secrets.template .secrets
   # Edit .secrets with your actual tokens
   ```

### Testing the Workflow

```bash
# Dry run - see what would execute
npm run act:release:dry

# Full local run (doesn't actually publish)
npm run act:release

# Or manually with specific tag
act push -e <(echo '{"ref": "refs/tags/v1.2.3"}')
```

## Troubleshooting

### Release failed in CI

1. Check the GitHub Actions logs:

   ```bash
   gh run list --workflow=release.yaml
   gh run view <run-id> --log
   ```

2. Common issues:
   - **NPM_TOKEN expired**: Update the secret in GitHub Settings
   - **Tests failed**: Fix tests locally and create a new release
   - **Build failed**: Check dependencies and build configuration

### Need to redo a release

If you need to redo a release (e.g., failed CI):

```bash
# Delete the tag locally and remotely
git tag -d v1.2.3
git push --delete origin v1.2.3

# Optionally revert the version commit
git reset --hard HEAD~1

# Create the release again
npm run release:patch
git push && git push --tags
```

### Accidentally published the wrong version

If you already published to npm, you can deprecate it:

```bash
# Deprecate a specific version
npm deprecate @ngx-odm/rxdb@1.2.3 "Accidental release, use 1.2.4 instead"

# For pre-releases, you can unpublish within 72 hours
npm unpublish @ngx-odm/rxdb@1.2.3-dev.0
```

## Available npm Scripts

| Script                            | Description                                         |
| --------------------------------- | --------------------------------------------------- |
| `npm run release`                 | Create release (version + changelog + commit + tag) |
| `npm run release:dry`             | Preview what would happen                           |
| `npm run release:patch`           | Patch release (1.0.0 → 1.0.1)                       |
| `npm run release:minor`           | Minor release (1.0.0 → 1.1.0)                       |
| `npm run release:major`           | Major release (1.0.0 → 2.0.0)                       |
| `npm run release:prerelease`      | Pre-release (1.0.0 → 1.0.0-dev.0)                   |
| `npm run release:prerelease:docs` | Pre-release with automatic docs deployment          |
| `npm run release:amend:docs`      | Add (+docs) marker to last commit                   |
| `npm run release:version`         | Only update versions                                |
| `npm run release:changelog`       | Only generate changelog                             |
| `npm run release:publish`         | Only publish to npm (CI use)                        |
| `npm run release:publish:docs`    | Manually trigger docs deployment for latest tag     |
| `npm run act:list`                | List all GitHub Actions workflows                   |
| `npm run act:release:dry`         | Test release workflow locally (dry run)             |
| `npm run act:release`             | Test release workflow locally                       |

## Configuration

Release configuration is in `nx.json` under the `release` key:

- **Conventional commits**: Automatically determines version from commit messages
- **Pre-version command**: Runs tests and builds before versioning
- **GitHub releases**: Automatically created with changelog
- **Tag pattern**: Uses `v{version}` format (e.g., v1.2.3)

For advanced configuration, see [NX Release Documentation](https://nx.dev/features/manage-releases).

## Migration Notes

This project migrated from `@jscutlery/semver` to native NX Release. Benefits:

- ✅ Simpler configuration
- ✅ Better GitHub integration
- ✅ Local testing with act
- ✅ Unified tooling (NX-native)
- ✅ Better pre-release handling
