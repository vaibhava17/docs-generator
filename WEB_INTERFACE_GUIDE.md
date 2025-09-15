# Web Interface Usage Guide

## 🌐 AI Documentation Generator Web Interface

The web interface provides an intuitive way to generate AI-powered documentation for GitHub repositories without using command-line tools.

### Access the Interface

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Open your browser** and navigate to:
   ```
   http://localhost:3000
   ```

## 📋 Using the Web Interface

### Step 1: Repository Configuration

#### Required Fields:
- **Repository URL**: Enter the full GitHub repository URL
  - Format: `https://github.com/owner/repo`
  - Example: `https://github.com/facebook/react`

- **Documentation Branch**: Name for the branch where docs will be created
  - Default: `docs-generation`
  - Can be customized (e.g., `auto-docs`, `documentation`)

#### Optional Fields:
- **GitHub Token**: Required only for private repositories
  - Get from: [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens)
  - Scopes needed: `repo` (private repos) or `public_repo` (public repos)

- **Target Directory**: Specific folder to document
  - Leave empty to document entire repository
  - Example: `src`, `lib`, `packages/core`

### Step 2: AI Configuration

#### AI Provider Selection:
- **OpenAI GPT-4**: More detailed documentation, higher quality
- **Google Gemini**: Faster processing, more cost-effective

#### API Key:
- **OpenAI**: Starts with `sk-`, get from [OpenAI Platform](https://platform.openai.com/api-keys)
- **Gemini**: Get from [Google AI Studio](https://makersuite.google.com/app/apikey)

### Step 3: Advanced Options

#### Switches:
- **Overwrite Existing Documentation**: Replace existing docs if they exist
- **Skip Confirmations**: Proceed without prompts (force mode)

### Step 4: Actions

#### Preview Files (Recommended First Step):
1. Click **"Preview Files"** button
2. Review the list of files that will be documented
3. Confirm the selection looks correct

#### Generate Documentation:
1. Click **"Generate Documentation"** button
2. Monitor real-time progress in the progress card
3. View activity logs as they appear

## 📊 Progress Monitoring

### Status Indicators:
- **Cloning**: Repository is being downloaded
- **Analyzing**: Files are being scanned and categorized
- **Generating**: AI is creating documentation for each file
- **Committing**: Changes are being saved and pushed to GitHub
- **Completed**: Process finished successfully
- **Error**: Something went wrong (check logs for details)

### Progress Information:
- **Progress Bar**: Visual indicator of completion percentage
- **File Counters**: Total files vs. documented files
- **Activity Log**: Real-time updates of what's happening
- **Detailed Messages**: Step-by-step progress information

## 🎯 Results and Actions

### Upon Completion:
- **View Documentation Branch**: Direct link to the GitHub branch with docs
- **Download Documentation**: Download a ZIP file with all generated docs
- **Success Summary**: Count of successfully documented files

## 🔍 Example Workflows

### Document a Small Public Repository:
1. Repository URL: `https://github.com/sindresorhus/is-online`
2. Leave GitHub Token empty (public repo)
3. Choose AI provider and enter API key
4. Click "Preview Files" to see what will be documented
5. Click "Generate Documentation"
6. Wait for completion and view results

### Document Specific Directory of Large Repository:
1. Repository URL: `https://github.com/facebook/react`
2. Target Directory: `packages/react`
3. Choose AI provider and enter API key
4. Enable "Skip Confirmations" for automation
5. Generate documentation

### Document Private Repository:
1. Repository URL: `https://github.com/your-company/private-repo`
2. GitHub Token: `ghp_xxxxxxxxxxxxxxxxxxxx`
3. Configure AI settings
4. Generate documentation

## 🚨 Error Handling

### Common Issues and Solutions:

#### "Repository not found" or "Permission denied":
- **Public repos**: Check URL format is correct
- **Private repos**: Ensure GitHub token has proper permissions
- Verify the repository exists and is accessible

#### "API key not found" or "Invalid API key":
- Check API key format (OpenAI starts with `sk-`)
- Ensure key has sufficient credits/quota
- Verify key is copied correctly without extra spaces

#### "No source files found":
- Check if target directory exists in the repository
- Verify repository contains supported file types
- Try without specifying target directory

#### Generation fails during processing:
- Check internet connectivity
- Verify API key has sufficient quota
- Some files may be too large (>50KB limit)

## 📁 Output Structure

### Generated Documentation:
```
Repository (on docs-generation branch)
├── docs/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Button.md
│   │   │   └── Modal.md
│   │   └── utils/
│   │       └── helpers.md
│   └── lib/
│       └── api.md
└── DOCUMENTATION_INDEX.md
```

### Each Documentation File Contains:
- **Overview**: Purpose and role of the file
- **Functions and Classes**: Detailed API documentation
- **Configuration**: Important constants and settings
- **Usage Examples**: Practical code examples
- **Dependencies**: Integration information
- **Additional Notes**: Best practices and gotchas

## 🔧 Customization

### Environment Variables:
Create a `.env.local` file for custom settings:
```env
OPENAI_API_KEY=your_openai_key_here
GEMINI_API_KEY=your_gemini_key_here
PREFERRED_AI=openai
```

### Default Settings:
- Branch name: `docs-generation`
- AI provider: OpenAI
- Overwrite: false (preserve existing docs)
- Force mode: false (show confirmations)

## 🛠️ Troubleshooting

### Browser Issues:
- **CORS errors**: Use the development server, not file:// URLs
- **JavaScript disabled**: Enable JavaScript in browser
- **Old browser**: Use modern browser (Chrome, Firefox, Safari, Edge)

### Performance:
- **Large repositories**: Use target directory to limit scope
- **Slow processing**: Gemini is generally faster than OpenAI
- **Rate limits**: Built-in delays prevent API rate limiting

### Network Issues:
- **Timeout errors**: Check internet connection
- **SSL errors**: Ensure secure connection to GitHub and AI providers

## 📈 Best Practices

### Repository Selection:
- Start with small repositories to test your setup
- Use target directories for large repositories
- Preview files before generating to verify scope

### API Key Management:
- Keep API keys secure and private
- Monitor API usage and costs
- Use separate keys for testing and production

### Documentation Quality:
- Review generated documentation before merging
- Provide feedback to improve AI prompts
- Customize templates for specific project needs

## 🎉 Success Tips

1. **Test First**: Always use "Preview Files" before generation
2. **Start Small**: Begin with small repositories or directories
3. **Check Results**: Review generated docs for accuracy
4. **Monitor Progress**: Watch the activity log for issues
5. **Save Work**: Download documentation as backup

## 📞 Support

For issues or feature requests:
- Check the activity logs for detailed error messages
- Verify all required fields are filled correctly
- Test with a simple public repository first
- Review the troubleshooting section above