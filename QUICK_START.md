# FlockPoster CLI - Quick Start Guide

## Installation

### From Source (Development)

```bash
# Navigate to the monorepo root
cd /path/to/gitroom

# Install dependencies
pnpm install

# Build the CLI
pnpm run build:cli

# Test locally
node apps/cli/dist/index.js --help
```

### Global Installation (Development)

```bash
# From the CLI directory
cd apps/cli

# Link globally
pnpm link --global

# Now you can use 'flockposter' anywhere
flockposter --help
```

### From npm (Coming Soon)

```bash
# Once published
npm install -g flockposter-cli

# Or with pnpm
pnpm add -g flockposter-cli
```

## Setup

### 1. Get Your API Key

1. Log in to your FlockPoster account at https://app.flockposter.com
2. Navigate to Settings → API Keys
3. Generate a new API key

### 2. Set Environment Variable

```bash
# Bash/Zsh
export FLOCKPOSTER_API_KEY=your_api_key_here

# Fish
set -x FLOCKPOSTER_API_KEY your_api_key_here

# PowerShell
$env:FLOCKPOSTER_API_KEY="your_api_key_here"
```

To make it permanent, add it to your shell profile:

```bash
# ~/.bashrc or ~/.zshrc
echo 'export FLOCKPOSTER_API_KEY=your_api_key_here' >> ~/.bashrc
source ~/.bashrc
```

### 3. Verify Installation

```bash
flockposter --help
```

## Basic Commands

### Create a Post

```bash
# Simple post
flockposter posts:create -c "Hello World!" -i "twitter-123"

# Post with multiple images
flockposter posts:create \
  -c "Check these out!" \
  -m "img1.jpg,img2.jpg" \
  -i "twitter-123"

# Post with comments (each can have different media!)
flockposter posts:create \
  -c "Main post" -m "main.jpg" \
  -c "First comment" -m "comment1.jpg" \
  -c "Second comment" -m "comment2.jpg" \
  -i "twitter-123"

# Scheduled post
flockposter posts:create \
  -c "Future post" \
  -s "2024-12-31T12:00:00Z" \
  -i "twitter-123"
```

### List Posts

```bash
# List all posts
flockposter posts:list

# With pagination
flockposter posts:list -p 2 -l 20

# Search
flockposter posts:list -s "keyword"
```

### Delete a Post

```bash
flockposter posts:delete abc123xyz
```

### List Integrations

```bash
flockposter integrations:list
```

### Upload Media

```bash
flockposter upload ./path/to/image.png
```

## Common Workflows

### 1. Check What's Connected

```bash
# See all your connected social media accounts
flockposter integrations:list
```

The output will show integration IDs like:
```json
[
  { "id": "twitter-123", "provider": "twitter" },
  { "id": "linkedin-456", "provider": "linkedin" }
]
```

### 2. Create Multi-Platform Post

```bash
# Use the integration IDs from step 1
flockposter posts:create \
  -c "Posting to multiple platforms!" \
  -i "twitter-123,linkedin-456,facebook-789"
```

### 3. Schedule Multiple Posts

```bash
# Morning post
flockposter posts:create -c "Good morning!" -s "2024-01-15T09:00:00Z"

# Afternoon post
flockposter posts:create -c "Lunch time update!" -s "2024-01-15T12:00:00Z"

# Evening post
flockposter posts:create -c "Good night!" -s "2024-01-15T20:00:00Z"
```

### 4. Upload and Post Image

```bash
# First upload the image
flockposter upload ./my-image.png

# Copy the URL from the response, then create post
flockposter posts:create -c "Check out this image!" --image "url-from-upload"
```

## Tips & Tricks

### Using with jq for JSON Parsing

```bash
# Get just the post IDs
flockposter posts:list | jq '.[] | .id'

# Get integration names
flockposter integrations:list | jq '.[] | .provider'
```

### Script Automation

```bash
#!/bin/bash
# Create a batch of posts

for hour in 09 12 15 18; do
  flockposter posts:create \
    -c "Automated post at ${hour}:00" \
    -s "2024-01-15T${hour}:00:00Z"
  echo "Created post for ${hour}:00"
done
```

### Environment Variables

```bash
# Custom API endpoint (for self-hosted)
export FLOCKPOSTER_API_URL=https://your-instance.com

# Use the CLI with custom endpoint
flockposter posts:list
```

## Troubleshooting

### API Key Not Set

```
❌ Error: FLOCKPOSTER_API_KEY environment variable is required
```

**Solution:** Set the environment variable:
```bash
export FLOCKPOSTER_API_KEY=your_key
```

### Command Not Found

```
flockposter: command not found
```

**Solution:** Either:
1. Use the full path: `node apps/cli/dist/index.js`
2. Link globally: `cd apps/cli && pnpm link --global`
3. Add to PATH: `export PATH=$PATH:/path/to/apps/cli/dist`

### API Errors

```
❌ API Error (401): Unauthorized
```

**Solution:** Check your API key is valid and has proper permissions.

```
❌ API Error (404): Not Found
```

**Solution:** Verify the post ID exists when deleting.

## Getting Help

```bash
# General help
flockposter --help

# Command-specific help
flockposter posts:create --help
flockposter posts:list --help
flockposter posts:delete --help
```

## Next Steps

- Read the full [README.md](./README.md) for detailed documentation
- Check [SKILL.md](./SKILL.md) for AI agent integration patterns
- See [examples/](./examples/) for more usage examples

## Links

- [FlockPoster Website](https://app.flockposter.com)
- [API Documentation](https://app.flockposter.com/api-docs)
- [GitHub Repository](https://github.com/OfficeXApp/flockposter)
- [Report Issues](https://github.com/OfficeXApp/flockposter/issues)
