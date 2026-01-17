# Manual Publish to GitHub Pages

Commands to update the `gh-pages` branch with contents from `dist/demo` using a git worktree.

## Prerequisites

- Build the project: `npm run build` (ensure `dist/demo` exists)
- `rsync` installed

## Commands

```bash
# 1. Add worktree for gh-pages
git worktree add tmp/gh-pages-worktree gh-pages

# 2. Sync content (excluding .git)
rsync -av --delete --exclude .git dist/demo/ tmp/gh-pages-worktree/

# 3. Commit and Push
cd tmp/gh-pages-worktree
git add .
git commit -m "chore(gh-pages): update demo content"
git push --force origin gh-pages

# 4. Cleanup
cd ../..
git worktree remove tmp/gh-pages-worktree
```
