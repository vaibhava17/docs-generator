# GitHub Documentation Generator

An AI-powered documentation generator that automatically creates comprehensive documentation for GitHub repositories using OpenAI GPT or Google Gemini.

## Features

- 🤖 **AI-Powered**: Uses OpenAI GPT-4 or Google Gemini to generate high-quality documentation
- 🔗 **GitHub Integration**: Works with both public and private GitHub repositories
- 🌿 **Branch Management**: Creates documentation in a separate branch
- 📁 **Smart File Detection**: Automatically finds and processes source code files
- 📋 **Index Generation**: Creates a comprehensive documentation index
- 🔄 **Update Support**: Can update existing documentation or create new docs
- 🎯 **Selective Processing**: Target specific directories or entire repositories

## Supported File Types

- **JavaScript/TypeScript**: `.js`, `.jsx`, `.ts`, `.tsx`
- **Python**: `.py`
- **Java**: `.java`
- **C/C++**: `.cpp`, `.c`, `.cc`, `.cxx`
- **Go**: `.go`
- **Rust**: `.rs`
- **PHP**: `.php`
- **Ruby**: `.rb`
- **C#**: `.cs`
- **Swift**: `.swift`
- **Kotlin**: `.kt`
- **Scala**: `.scala`
- **Vue**: `.vue`
- **Svelte**: `.svelte`

## Installation

1. **Clone this repository**:
   ```bash
   git clone https://github.com/your-username/docs-generator.git
   cd docs-generator
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   npm run docs:setup
   ```
   
   Or manually create a `.env` file:
   ```env
   # Choose your preferred AI provider
   OPENAI_API_KEY=your_openai_api_key_here
   GEMINI_API_KEY=your_gemini_api_key_here
   PREFERRED_AI=openai  # or gemini
   ```

## Quick Start

### 1. Setup API Keys

```bash
npm run docs:setup
```

This will create a `.env` file template. Add your API keys:

- **OpenAI**: Get your key at [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
- **Gemini**: Get your key at [https://makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)

### 2. Generate Documentation

**For a public repository**:
```bash
npm run docs:generate https://github.com/owner/repo
```

**For a private repository**:
```bash
npm run docs:generate https://github.com/owner/repo --token your_github_token
```

**With custom options**:
```bash
npm run docs:generate https://github.com/owner/repo \
  --path src \
  --branch documentation \
  --provider gemini \
  --overwrite
```

## CLI Commands

### Generate Documentation

```bash
npm run docs:generate <repo-url> [options]
```

**Options:**
- `-t, --token <token>` - GitHub Personal Access Token for private repos
- `-p, --path <path>` - Target directory to document (default: entire repo)
- `-b, --branch <branch>` - Branch name for documentation (default: docs-generation)
- `--provider <provider>` - AI provider: openai or gemini (default: openai)
- `--api-key <key>` - AI API key (or use environment variable)
- `--overwrite` - Overwrite existing documentation files
- `-f, --force` - Skip confirmation prompts
- `-l, --list-files` - List files that would be documented without generating

### Examples

**Document entire repository**:
```bash
npm run docs:generate https://github.com/facebook/react
```

**Document specific directory**:
```bash
npm run docs:generate https://github.com/vercel/next.js --path packages/next
```

**Use private repository with token**:
```bash
npm run docs:generate https://github.com/company/private-repo --token ghp_xxxxxxxxxxxx
```

**Use Gemini instead of OpenAI**:
```bash
npm run docs:generate https://github.com/owner/repo --provider gemini
```

**List files without generating docs**:
```bash
npm run docs:generate https://github.com/owner/repo --list-files
```

**Overwrite existing documentation**:
```bash
npm run docs:generate https://github.com/owner/repo --overwrite
```

### Setup Environment

```bash
npm run docs:setup
```

Creates a `.env` file template with instructions for adding your API keys.

## How It Works

1. **Repository Cloning**: Clones the specified GitHub repository to a temporary directory
2. **Branch Creation**: Creates a new branch (default: `docs-generation`) for documentation
3. **File Discovery**: Scans the repository for supported source code files
4. **AI Analysis**: Uses AI to analyze each file and generate comprehensive documentation
5. **Documentation Creation**: Saves documentation as Markdown files in a `docs/` directory
6. **Index Generation**: Creates a `DOCUMENTATION_INDEX.md` with links to all documentation
7. **Git Operations**: Commits and pushes the documentation to the specified branch
8. **Cleanup**: Removes temporary files

## Documentation Structure

The generator creates documentation with the following structure:

```
docs/
├── src/
│   ├── components/
│   │   ├── Button.md
│   │   └── Modal.md
│   ├── utils/
│   │   └── helpers.md
│   └── index.md
└── DOCUMENTATION_INDEX.md
```

Each documentation file includes:

- **Overview**: High-level explanation of the file's purpose
- **Functions and Classes**: Detailed documentation of exports
- **Configuration**: Important constants and settings
- **Usage Examples**: Practical usage patterns
- **Dependencies**: Integration with other parts of the codebase
- **Additional Notes**: Best practices and implementation details

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENAI_API_KEY` | OpenAI API key for GPT models | One of OpenAI or Gemini |
| `GEMINI_API_KEY` | Google Gemini API key | One of OpenAI or Gemini |
| `PREFERRED_AI` | Preferred AI provider (`openai` or `gemini`) | No (default: openai) |

## GitHub Token Setup

For private repositories, you need a GitHub Personal Access Token:

1. Go to [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Select scopes: `repo` (for private repos) or `public_repo` (for public repos)
4. Use the token with the `--token` option

## Error Handling

The tool includes comprehensive error handling:

- **Network Issues**: Automatic retries for network failures
- **API Rate Limits**: Built-in rate limiting to respect AI API limits
- **File Processing**: Skips problematic files and continues processing
- **Git Operations**: Handles branch conflicts and push failures
- **Cleanup**: Always cleans up temporary files, even on errors

## Limitations

- **File Size**: Skips files larger than 50KB to manage AI token limits
- **Binary Files**: Only processes text-based source code files
- **API Costs**: AI API calls have associated costs (see provider pricing)
- **Rate Limits**: Respects AI API rate limits with built-in delays

## Troubleshooting

### Common Issues

**"Invalid GitHub repository URL"**
- Ensure URL format: `https://github.com/owner/repo`
- Don't include `.git` suffix

**"API key not found"**
- Check your `.env` file has the correct API key
- Use `npm run docs:setup` to verify configuration

**"Permission denied" for private repos**
- Ensure GitHub token has correct permissions
- Use `--token` option with a valid Personal Access Token

**"No source files found"**
- Check the `--path` option points to a valid directory
- Verify the repository contains supported file types

### Debug Mode

For detailed error information, check the console output. The tool provides comprehensive logging of all operations.

## Next.js Web Interface

This project also includes a Next.js web interface for easier usage:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access the web interface.

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Run tests: `npm test`
5. Commit changes: `git commit -am 'Add feature'`
6. Push to branch: `git push origin feature-name`
7. Submit a Pull Request

## License

MIT License - see LICENSE file for details.

## Security

- Never commit your `.env` file to version control
- Keep your API keys secure and private
- Use minimal GitHub token permissions
- Review generated documentation before merging

## Support

For issues and feature requests, please create an issue on GitHub.
