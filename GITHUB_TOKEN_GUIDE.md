# GitHub Token Setup Guide

## 🔑 Why GitHub Token is Required

The AI Documentation Generator needs to **push documentation to GitHub repositories**. Even for public repositories, you need authentication to push changes. The tool uses your GitHub Personal Access Token (PAT) to authenticate all git operations.

## ⚠️ Important: Token is Required for ALL Repositories

- **Public Repositories**: Still need token to push documentation
- **Private Repositories**: Need token for both access and push
- **Your Own Repositories**: Still need token for authentication
- **Others' Repositories**: Need token with proper permissions

## 🔧 How to Create a GitHub Personal Access Token

### Step 1: Access GitHub Settings
1. Go to [GitHub.com](https://github.com) and sign in
2. Click your profile picture (top right)
3. Select **"Settings"**
4. Scroll down and click **"Developer settings"** (left sidebar)
5. Click **"Personal access tokens"**
6. Choose **"Tokens (classic)"**

### Step 2: Generate New Token
1. Click **"Generate new token"** → **"Generate new token (classic)"**
2. Give your token a descriptive name:
   - Example: `AI Documentation Generator`
   - Example: `Docs Auto-Generator Tool`

### Step 3: Set Expiration
- Choose expiration period (recommend: 90 days or 1 year)
- For production use: No expiration (but less secure)

### Step 4: Select Scopes (Permissions)
**Required scopes for documentation generation:**

#### For Public Repositories:
- ✅ `public_repo` - Access public repositories
- **OR** ✅ `repo` - Full control (works for both public and private)

#### For Private Repositories:
- ✅ `repo` - Full control of private repositories
  - This includes: `repo:status`, `repo_deployment`, `public_repo`
  - **⚠️ REQUIRED**: Private repositories MUST have `repo` scope, `public_repo` is not sufficient

#### Additional Recommended Scopes:
- ✅ `workflow` - Update GitHub Action workflows (if documenting CI/CD)
- ✅ `read:org` - Read organization membership (for organization repos)

#### ⭐ **Recommended**: Use `repo` scope for all repositories
- Works with both public and private repositories
- Simplifies token management
- Avoids scope-related errors

### Step 5: Generate and Copy Token
1. Click **"Generate token"**
2. **⚠️ IMPORTANT**: Copy the token immediately
3. **You cannot see this token again!**
4. Save it securely (password manager recommended)

## 🎯 Token Format and Examples

### Valid Token Format:
```
ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Token Examples:
- Classic PAT: `ghp_1A2B3C4D5E6F7G8H9I0J1K2L3M4N5O6P7Q8R9S0T`
- Fine-grained PAT: `github_pat_11AAAAAA...` (newer format)

## 🔒 Security Best Practices

### ✅ Do:
- Store token in secure password manager
- Use minimal required scopes
- Set reasonable expiration dates
- Regenerate tokens periodically
- Delete unused tokens

### ❌ Don't:
- Share tokens in code or screenshots
- Commit tokens to repositories
- Use tokens with excessive permissions
- Store in plain text files

## 🚀 Using the Token

### In the Web Interface:
1. Open the documentation generator: `http://localhost:3000`
2. Fill in the **"GitHub Token (Required for Push)"** field
3. Paste your token: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
4. The tool will use this token for all git operations

### Token is Used For:
- Cloning repositories (if private)
- Creating documentation branches
- Committing documentation files
- Pushing changes to GitHub

## 🔧 Troubleshooting Token Issues

### "Permission denied" Error:
```
remote: Permission to user/repo.git denied to username.
fatal: unable to access 'https://github.com/user/repo/': The requested URL returned error: 403
```

**Solutions:**
1. **Check token permissions**: Ensure `repo` or `public_repo` scope
2. **Verify token validity**: Token may be expired
3. **Check repository access**: You need push access to the repository
4. **Regenerate token**: Create a new token with correct scopes
5. **Use correct authentication format**: The tool now uses `x-access-token` authentication format
6. **Check organization SSO**: If repository is in an organization with SSO, authorize your token

### "Token not found" Error:
```
❌ GitHub Token is required to push documentation to any repository
```

**Solutions:**
1. **Fill token field**: The GitHub token field cannot be empty
2. **Correct format**: Ensure token starts with `ghp_` or `github_pat_`
3. **No extra spaces**: Copy token exactly without trailing spaces

### "Invalid token" Error:
```
❌ Error with authentication
```

**Solutions:**
1. **Check token validity**: Log into GitHub and verify token exists
2. **Regenerate if needed**: Create a new token
3. **Verify scopes**: Ensure proper permissions are selected

## 📋 Repository Access Requirements

### For Any Repository (Public or Private):
- Token with `public_repo` scope (minimum)
- Push access to the repository
- Repository must exist and be accessible

### For Private Repositories:
- Token with `repo` scope (full access)
- Member of organization (if applicable)
- Repository collaboration access

### For Organization Repositories:
- Organization member with push access
- Token with appropriate scopes
- Organization may require token approval

## 🎯 Quick Setup Checklist

- [ ] Created GitHub Personal Access Token
- [ ] Selected correct scopes (`repo` or `public_repo`)
- [ ] Copied token securely
- [ ] Pasted token in documentation generator
- [ ] Verified repository access permissions
- [ ] Tested with a small repository first

## 🆘 Need Help?

### Common Issues:
1. **Forgot to copy token**: Generate a new one
2. **Token expired**: Create a new token with longer expiration
3. **Wrong permissions**: Delete old token, create new with correct scopes
4. **Repository access**: Ask repository owner for collaboration access

### Support Resources:
- [GitHub PAT Documentation](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)
- [GitHub Scopes Explanation](https://docs.github.com/en/developers/apps/building-oauth-apps/scopes-for-oauth-apps)
- [Troubleshooting Git Authentication](https://docs.github.com/en/authentication/troubleshooting-ssh/error-permission-denied-publickey)

## 🔄 Token Management

### Regular Maintenance:
- Review tokens monthly
- Delete unused tokens
- Rotate tokens every 6-12 months
- Monitor token usage in GitHub settings

### Security Monitoring:
- Check for unauthorized usage
- Review recent activity logs
- Enable two-factor authentication
- Use organization token policies if applicable

---

**Remember**: The GitHub token is essential for the documentation generator to push changes to any repository. Without it, the tool can only read public repositories but cannot save the generated documentation back to GitHub.