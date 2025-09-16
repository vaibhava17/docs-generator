# 🤖 AI Documentation Generator

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15.x-black)](https://nextjs.org/)

> Automatically generate comprehensive documentation for any GitHub repository using AI. Supports OpenAI GPT and Google Gemini for intelligent code analysis and documentation generation.

**🌐 Live Demo:** [https://docs-generator-phi.vercel.app](https://docs-generator-phi.vercel.app)

## ✨ Features

- 🚀 **One-click Documentation**: Generate comprehensive docs for any GitHub repository
- 🧠 **AI-Powered Analysis**: Uses OpenAI GPT or Google Gemini for intelligent code understanding
- 📚 **Multi-Language Support**: JavaScript, TypeScript, Python, Java, C++, Go, Rust, PHP, Ruby, C#, Swift, Kotlin, Scala, Vue, Svelte, and more
- 🎨 **Beautiful Web Interface**: Modern, responsive UI built with Next.js and Tailwind CSS
- 📋 **CLI Tool**: Command-line interface for automated workflows
- 🔒 **Private Repository Support**: Works with private repos using GitHub tokens
- 📄 **Markdown Output**: Clean, professional documentation in Markdown format
- ⚡ **Fast & Efficient**: Optimized for large codebases with smart file filtering

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/vaibhava17/docs-generator.git
cd docs-generator
npm install
```

### 2. Environment Setup

Create a `.env` file in the root directory:

```env
# Site Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# AI API Keys (Choose one or both)
OPENAI_API_KEY=your_openai_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here

# Preferred AI Provider (openai or gemini)
PREFERRED_AI=openai

# GitHub Token (for private repositories)
GITHUB_TOKEN=your_github_token_here
```

### 3. Run the Application

```bash
# Development server
npm run dev

# Or use the CLI directly
npm run docs:generate https://github.com/username/repository
```

## 📖 Usage

### Web Interface

1. Open [http://localhost:3000](http://localhost:3000) in your browser
2. Enter a GitHub repository URL
3. Configure AI provider and settings
4. Click "Generate Documentation"
5. Download the generated docs as a ZIP file

### CLI Usage

```bash
# Interactive setup
npm run docs:setup

# Generate documentation
npm run docs:generate <repository-url>

# Build CLI tool
npm run build:cli
```

## 🛠️ API Configuration

### OpenAI Setup

1. Get an API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Add to your `.env` file: `OPENAI_API_KEY=sk-...`

### Google Gemini Setup

1. Get an API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Add to your `.env` file: `GEMINI_API_KEY=...`

### GitHub Token (Optional)

For private repositories or higher rate limits:

1. Create a [Personal Access Token](https://github.com/settings/tokens)
2. Grant repository access permissions
3. Add to your `.env` file: `GITHUB_TOKEN=ghp_...`

## 🏗️ Development

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- An AI API key (OpenAI or Google Gemini)

### Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run linting
npm run lint

# Build CLI tool
npm run build:cli
```

### Project Structure

```
src/
├── app/                    # Next.js app router
│   ├── api/               # API routes
│   ├── (pages)/           # App pages
│   └── globals.css        # Global styles
├── components/            # React components
├── lib/                   # Utilities and services
└── cli/                   # CLI implementation
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### How to Contribute

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Add tests if applicable
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙋‍♂️ Support

- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/vaibhava17/docs-generator/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/vaibhava17/docs-generator/discussions)
- 📧 **Questions**: Open an issue with the "question" label

## 🌟 Show Your Support

If this project helped you, please give it a ⭐ on GitHub and share it with others!

## 📊 Supported Languages

| Language | Extension | Status |
|----------|-----------|---------|
| JavaScript | `.js` | ✅ |
| TypeScript | `.ts`, `.tsx` | ✅ |
| Python | `.py` | ✅ |
| Java | `.java` | ✅ |
| C++ | `.cpp`, `.h` | ✅ |
| Go | `.go` | ✅ |
| Rust | `.rs` | ✅ |
| PHP | `.php` | ✅ |
| Ruby | `.rb` | ✅ |
| C# | `.cs` | ✅ |
| Swift | `.swift` | ✅ |
| Kotlin | `.kt` | ✅ |
| Scala | `.scala` | ✅ |
| Vue | `.vue` | ✅ |
| Svelte | `.svelte` | ✅ |

## 🔮 Roadmap

- [ ] Syntax highlighting in generated docs
- [ ] Custom documentation templates
- [ ] Integration with popular documentation platforms
- [ ] Support for more file types
- [ ] Automated documentation updates
- [ ] Team collaboration features

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/vaibhava17">vaibhava17</a>
</p>