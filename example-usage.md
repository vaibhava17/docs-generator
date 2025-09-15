# Example Usage

Here are practical examples of how to use the GitHub Documentation Generator:

## Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Setup environment**:
   ```bash
   npm run docs:setup
   ```
   
   Edit the `.env` file and add your API keys:
   ```env
   OPENAI_API_KEY=sk-your-actual-openai-key-here
   # OR
   GEMINI_API_KEY=your-actual-gemini-key-here
   ```

## Basic Usage Examples

### 1. Document a Small Public Repository

```bash
npm run docs:generate https://github.com/sindresorhus/is-online -- --list-files
```

This will list all files that would be documented without actually generating documentation.

### 2. Generate Documentation for a Specific Directory

```bash
npm run docs:generate https://github.com/expressjs/express -- --path lib --provider openai
```

This documents only the `lib` directory of the Express.js repository using OpenAI.

### 3. Document a Private Repository

```bash
npm run docs:generate https://github.com/your-company/private-repo -- --token ghp_xxxxxxxxxxxxxxxxxxxx --branch auto-docs
```

### 4. Overwrite Existing Documentation

```bash
npm run docs:generate https://github.com/owner/repo -- --overwrite --force
```

## Test with a Simple Repository

For testing, you can use these small, well-structured repositories:

1. **is-online** (Simple utility):
   ```bash
   npm run docs:generate https://github.com/sindresorhus/is-online
   ```

2. **chalk** (Terminal styling):
   ```bash
   npm run docs:generate https://github.com/chalk/chalk -- --path source
   ```

3. **lodash utility** (Specific functions):
   ```bash
   npm run docs:generate https://github.com/lodash/lodash -- --path src/core
   ```

## CLI Options Reference

| Option | Description | Example |
|--------|-------------|---------|
| `--token <token>` | GitHub PAT for private repos | `--token ghp_xxx` |
| `--path <path>` | Target directory | `--path src/components` |
| `--branch <name>` | Documentation branch | `--branch auto-docs` |
| `--provider <ai>` | AI provider (openai/gemini) | `--provider gemini` |
| `--api-key <key>` | AI API key | `--api-key sk-xxx` |
| `--overwrite` | Overwrite existing docs | `--overwrite` |
| `--force` | Skip confirmations | `--force` |
| `--list-files` | Preview files to document | `--list-files` |

## Expected Output

When successful, you should see:

```
🚀 GitHub Documentation Generator
================================
🔍 Cloning repository: https://github.com/owner/repo
✅ Repository cloned to: /tmp/temp-repos/repo
🌿 Creating documentation branch: docs-generation
✅ Switched to branch: docs-generation
🔍 Scanning for source files in: /tmp/temp-repos/repo
📊 Found 15 files to document, 0 with existing docs
📝 Files to be documented: 15

📄 [1/15] Processing: src/index.js
🤖 Using OpenAI for index.js
✅ Documented: src/index.js

... (continues for each file)

📋 Generating documentation index...
✅ Documentation index updated: DOCUMENTATION_INDEX.md
📤 Committing and pushing documentation...
✅ Changes committed
✅ Changes pushed to docs-generation branch

🎉 GitHub documentation generation completed!
✅ Successfully documented: 15 files
❌ Failed to document: 0 files

📚 Check DOCUMENTATION_INDEX.md for the complete documentation overview
📁 All documentation files are saved in the 'docs/' directory
🌿 Documentation is available on the 'docs-generation' branch
```

## Troubleshooting

### Common Issues

1. **"API key not found"**
   - Make sure you've run `npm run docs:setup`
   - Check that your `.env` file contains valid API keys
   - Ensure the API key format is correct (starts with `sk-` for OpenAI)

2. **"Invalid GitHub repository URL"**
   - Use the format: `https://github.com/owner/repo`
   - Don't include `.git` at the end

3. **"Permission denied"**
   - For private repos, make sure your GitHub token has `repo` scope
   - For public repos, ensure the repository exists and is accessible

4. **"No source files found"**
   - Check that the `--path` parameter points to a valid directory
   - Verify the repository contains supported file types

### Testing Your Setup

Test with a simple repository first:

```bash
# List files (no API key needed)
npm run docs:generate https://github.com/sindresorhus/is-online -- --list-files

# Generate docs (requires API key)
npm run docs:generate https://github.com/sindresorhus/is-online -- --provider openai
```

## Next Steps

1. **Choose an AI Provider**: OpenAI GPT-4 generally provides more detailed documentation, while Gemini is faster and more cost-effective.

2. **Set GitHub Token**: For private repositories, create a Personal Access Token with appropriate permissions.

3. **Start Small**: Begin with small repositories to test your setup before documenting larger codebases.

4. **Review Output**: Always review the generated documentation before merging it into your main branch.