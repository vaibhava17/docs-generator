# Contributing to AI Documentation Generator

Thank you for your interest in contributing to the AI Documentation Generator! We welcome contributions from everyone and are grateful for every contribution made to the project.

## 🤝 How to Contribute

### Reporting Issues

Before creating bug reports, please check the issue list as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples** to demonstrate the steps
- **Describe the behavior you observed** after following the steps
- **Explain which behavior you expected to see instead**
- **Include screenshots** if applicable

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

- **Use a clear and descriptive title**
- **Provide a step-by-step description** of the suggested enhancement
- **Provide specific examples** to demonstrate the steps
- **Describe the current behavior** and **explain the behavior you expected to see**
- **Explain why this enhancement would be useful**

### Pull Requests

1. **Fork the repository** and create your branch from `main`
2. **Install dependencies**: `npm install`
3. **Make your changes** in a new git branch:
   ```bash
   git checkout -b my-fix-branch main
   ```
4. **Follow the coding standards** (see below)
5. **Test your changes** thoroughly
6. **Commit your changes** using descriptive commit messages
7. **Push your branch** to GitHub:
   ```bash
   git push origin my-fix-branch
   ```
8. **Create a Pull Request** to the main branch

## 📝 Development Setup

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- Git

### Getting Started

1. **Fork and clone the repository**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/docs-generator.git
   cd docs-generator
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Add your API keys to .env
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```

5. **Open your browser** to `http://localhost:3000`

## 🎯 Coding Standards

### Code Style

- Use **TypeScript** for all new code
- Follow **ESLint** configuration (run `npm run lint`)
- Use **Prettier** for code formatting
- Write **clear, descriptive variable and function names**
- Add **JSDoc comments** for functions and classes

### File Structure

```
src/
├── app/                    # Next.js app router
│   ├── api/               # API routes
│   ├── (pages)/           # App pages
│   └── globals.css        # Global styles
├── components/            # Reusable React components
├── lib/                   # Utilities and services
└── cli/                   # CLI implementation
```

### Component Guidelines

- Use **functional components** with hooks
- Implement **proper TypeScript interfaces**
- Follow the **single responsibility principle**
- Use **meaningful prop names** and provide defaults when appropriate
- Include **proper error handling**

### Example Component

```tsx
interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

export default function Button({ 
  children, 
  onClick, 
  variant = 'primary', 
  disabled = false 
}: ButtonProps) {
  return (
    <button
      className={`btn btn-${variant}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run linting
npm run lint

# Check TypeScript
npm run type-check
```

### Writing Tests

- Write tests for new features
- Include edge cases
- Test error conditions
- Use descriptive test names

## 📦 Commit Guidelines

We follow the [Conventional Commits](https://conventionalcommits.org/) specification:

### Commit Message Format

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### Types

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Changes that do not affect the meaning of the code
- **refactor**: A code change that neither fixes a bug nor adds a feature
- **perf**: A code change that improves performance
- **test**: Adding missing tests or correcting existing tests
- **chore**: Changes to the build process or auxiliary tools

### Examples

```bash
feat(cli): add support for custom output directory
fix(api): handle empty repository responses
docs: update installation instructions
style: format code with prettier
```

## 🚀 Release Process

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Create a new release on GitHub
4. The CI/CD pipeline will handle deployment

## 🆘 Getting Help

- **GitHub Issues**: For bugs and feature requests
- **GitHub Discussions**: For questions and general discussion
- **Discord**: Join our community (link in README)

## 📋 Checklist

Before submitting your pull request, please make sure:

- [ ] Your code follows the project's coding standards
- [ ] You've added tests for new functionality
- [ ] All tests pass (`npm test`)
- [ ] Linting passes (`npm run lint`)
- [ ] TypeScript compiles without errors
- [ ] You've updated documentation if needed
- [ ] Your commit messages follow the conventional format
- [ ] You've tested your changes locally

## 🎉 Recognition

Contributors are recognized in our:
- `CONTRIBUTORS.md` file
- GitHub contributors section
- Release notes

## 📄 Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## 📞 Questions?

Don't hesitate to reach out if you have questions:
- Open an issue for bugs or feature requests
- Start a discussion for general questions
- Contact [@vaibhava17](https://github.com/vaibhava17) directly

Thank you for contributing! 🙏