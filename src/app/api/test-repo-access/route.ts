import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { repoUrl, githubToken } = await request.json();

    if (!repoUrl || !githubToken) {
      return NextResponse.json({ error: 'Repository URL and GitHub token are required' }, { status: 400 });
    }

    // Extract owner and repo from URL
    const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) {
      return NextResponse.json({ error: 'Invalid GitHub repository URL format' }, { status: 400 });
    }

    const [, owner, repoName] = match;
    const cleanRepoName = repoName.replace('.git', '');

    console.log(`🔍 Testing access to repository: ${owner}/${cleanRepoName}`);

    // First check if repository exists publicly (without token)
    const publicCheck = await fetch(`https://api.github.com/repos/${owner}/${cleanRepoName}`, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'docs-generator'
      }
    });

    if (!publicCheck.ok && publicCheck.status === 404) {
      return NextResponse.json({ 
        error: `Repository '${owner}/${cleanRepoName}' does not exist or is not accessible. Please check the repository name and URL.` 
      }, { status: 404 });
    }

    // Now check with token for permissions
    const response = await fetch(`https://api.github.com/repos/${owner}/${cleanRepoName}`, {
      headers: {
        'Authorization': `Bearer ${githubToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'docs-generator'
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        return NextResponse.json({ 
          error: 'Invalid GitHub token. Please check your token format and validity.' 
        }, { status: 401 });
      } else if (response.status === 403) {
        const responseText = await response.text();
        if (responseText.includes('rate limit')) {
          return NextResponse.json({ 
            error: 'GitHub API rate limit exceeded. Please wait a few minutes and try again.' 
          }, { status: 429 });
        }
        return NextResponse.json({ 
          error: 'GitHub token does not have sufficient permissions. Ensure your token has "repo" scope for private repositories or "public_repo" scope for public repositories.' 
        }, { status: 403 });
      } else if (response.status === 404) {
        return NextResponse.json({ 
          error: 'Repository access denied. This could mean the repository is private and your token does not have access, or you need to be added as a collaborator.' 
        }, { status: 404 });
      } else {
        return NextResponse.json({ 
          error: `GitHub API error: ${response.status} ${response.statusText}` 
        }, { status: response.status });
      }
    }

    const repoData = await response.json();

    console.log(`✅ Repository access test successful for: ${repoData.full_name}`);

    return NextResponse.json({
      success: true,
      fullName: repoData.full_name,
      private: repoData.private,
      permissions: {
        push: repoData.permissions?.push || false,
        pull: repoData.permissions?.pull || false,
        admin: repoData.permissions?.admin || false
      },
      owner: {
        login: repoData.owner.login,
        type: repoData.owner.type
      }
    });

  } catch (error) {
    console.error('Repository access test error:', error);
    return NextResponse.json(
      { error: 'Failed to test repository access: ' + (error as Error).message },
      { status: 500 }
    );
  }
}