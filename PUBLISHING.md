# Publishing the FlockPoster CLI to npm

## Quick Publish

```bash
# From apps/cli directory
pnpm run test
pnpm publish --access public
```

Then users can install:
```bash
npm install -g flockposter-cli
# or
pnpm install -g flockposter-cli

# And use:
flockposter --help
```

## Publishing with a Different Package Name

If you want to publish as a different npm package name (e.g., "agent-flockposter"):

### 1. Change Package Name

Edit `apps/cli/package.json`:

```json
{
  "name": "agent-flockposter",  // ← Changed package name
  "version": "1.0.0",
  "bin": {
    "flockposter": "./dist/index.js"  // ← Keep command name!
  }
}
```

**Important:** The `bin` field determines the command name, NOT the package name!

### 2. Publish

```bash
cd apps/cli
pnpm run test
pnpm publish --access public
```

### 3. Users Install

```bash
npm install -g agent-flockposter
# or
pnpm install -g agent-flockposter
```

### 4. Users Use

Even though the package is called "agent-flockposter", the command is still:

```bash
flockposter --help  # ← Command name from "bin" field
flockposter posts:create -c "Hello!" -i "twitter-123"
```

## Package Name vs Command Name

| Field | Purpose | Example |
|-------|---------|---------|
| `"name"` | npm package name (what you install) | `"agent-flockposter"` |
| `"bin"` | Command name (what you type) | `"flockposter"` |

**Examples:**

1. **Same name:**
   ```json
   "name": "flockposter-cli",
   "bin": { "flockposter": "./dist/index.js" }
   ```
   Install: `npm i -g flockposter-cli`
   Use: `flockposter`

2. **Different names:**
   ```json
   "name": "agent-flockposter",
   "bin": { "flockposter": "./dist/index.js" }
   ```
   Install: `npm i -g agent-flockposter`
   Use: `flockposter`

3. **Multiple commands:**
   ```json
   "name": "agent-flockposter",
   "bin": {
     "flockposter": "./dist/index.js",
     "pz": "./dist/index.js"
   }
   ```
   Install: `npm i -g agent-flockposter`
   Use: `flockposter` or `pz`

## Publishing Checklist

### Before First Publish

- [ ] Verify package name is available on npm
  ```bash
  npm view flockposter-cli
  # If error "404 Not Found" - name is available!
  ```

- [ ] Update version if needed
  ```json
  "version": "1.0.0"
  ```

- [ ] Review files to include
  ```json
  "files": [
    "dist",
    "README.md",
    "SKILL.md"
  ]
  ```

- [ ] Build the package
  ```bash
  pnpm run test
  ```

- [ ] Test locally
  ```bash
  pnpm link --global
  flockposter --help
  ```

- [ ] Enable npm 2FA for publishing or use a tightly scoped granular token

- [ ] Prefer npm trusted publishing over long-lived write tokens
  `https://docs.npmjs.com/trusted-publishers/`

### Publish to npm

```bash
# Login to npm (first time only)
npm login

# From apps/cli
pnpm run test
pnpm publish --access public

# Or use the root script
cd /path/to/monorepo/root
pnpm run publish-cli
```

### After Publishing

Verify it's published:
```bash
npm view flockposter-cli
# Should show your package info
```

Test installation:
```bash
npm install -g flockposter-cli
flockposter --version
```

## Using from Monorepo Root

The root `package.json` already has:

```json
{
  "scripts": {
    "publish-cli": "pnpm run --filter ./apps/cli publish"
  }
}
```

So you can publish from the root:

```bash
# From monorepo root
pnpm run publish-cli
```

## Version Updates

### Patch Release (1.0.0 → 1.0.1)

```bash
cd apps/cli
npm version patch
pnpm publish --access public
```

### Minor Release (1.0.0 → 1.1.0)

```bash
cd apps/cli
npm version minor
pnpm publish --access public
```

### Major Release (1.0.0 → 2.0.0)

```bash
cd apps/cli
npm version major
pnpm publish --access public
```

## Scoped Packages

If you want to publish under an organization scope:

```json
{
  "name": "@yourorg/flockposter",
  "bin": {
    "flockposter": "./dist/index.js"
  }
}
```

Install:
```bash
npm install -g @yourorg/flockposter
```

Use:
```bash
flockposter --help
```

## Testing Before Publishing

### Test the Build

```bash
pnpm run build
node dist/index.js --help
```

### Test Linking

```bash
pnpm link --global
flockposter --help
pnpm unlink --global
```

### Test Publishing (Dry Run)

```bash
npm publish --dry-run
# Shows what would be published
```

### Test with `npm pack`

```bash
npm pack
# Creates a .tgz file

# Test installing the tarball
npm install -g ./flockposter-cli-1.0.0.tgz
flockposter --help
npm uninstall -g flockposter-cli
```

## Continuous Publishing

### Using GitHub Actions

Create `.github/workflows/publish-cli.yml`:

```yaml
name: Publish CLI to npm

on:
  push:
    tags:
      - 'cli-v*'

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'

      - run: pnpm install
      - run: pnpm run build:cli

      - name: Publish to npm
        run: pnpm --filter ./apps/cli publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

Then publish with:
```bash
git tag cli-v1.0.0
git push origin cli-v1.0.0
```

## Common Issues

### "You do not have permission to publish"

- Make sure you're logged in: `npm login`
- Check package name isn't taken: `npm view flockposter-cli`
- If scoped, ensure org access: `npm org ls yourorg`

### "Package name too similar to existing package"

- Choose a more unique name
- Or use a scoped package: `@yourorg/flockposter`

### "Missing required files"

- Check `"files"` field in package.json
- Run `npm pack` to see what would be included
- Make sure `dist/` exists and is built

### Command not found after install

- Check `"bin"` field is correct
- Ensure `dist/index.js` has shebang: `#!/usr/bin/env node`
- Try reinstalling: `npm uninstall -g flockposter-cli && npm install -g flockposter-cli`

## Recommended Names

If "flockposter" is taken, consider:

- `@flockposter/cli`
- `flockposter-cli`
- `flockposter-agent`
- `agent-flockposter`
- `@yourorg/flockposter`

Remember: The package name is just for installation. The command can still be `flockposter`!

## Summary

✅ Current setup works perfectly!
✅ `bin` field defines the command name
✅ `name` field defines the npm package name
✅ They can be different!

**To publish now:**

```bash
cd apps/cli
pnpm run build
pnpm publish --access public
```

**Users install:**

```bash
npm install -g flockposter-cli
# or
pnpm install -g flockposter-cli
```

**Users use:**

```bash
flockposter --help
flockposter posts:create -c "Hello!" -i "twitter-123"
```

🚀 **Ready to publish!**
