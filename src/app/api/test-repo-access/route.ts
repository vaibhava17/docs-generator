import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { repoUrl, githubToken } = await request.json();

    if (!repoUrl || !githubToken) {
      return NextResponse.json(
        { error: "Repository URL and GitHub token are required" },
        { status: 400 }
      );
    }

    // Extract owner and repo from URL
    const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) {
      return NextResponse.json(
        { error: "Invalid GitHub repository URL format" },
        { status: 400 }
      );
    }

    const [, owner, repoName] = match;
    const cleanRepoName = repoName.replace(".git", "");

    console.log(`🔍 Testing access to repository: ${owner}/${cleanRepoName}`);

    // First validate token and check scopes
    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "docs-generator",
      },
    });

    if (!userResponse.ok) {
      if (userResponse.status === 401) {
        return NextResponse.json(
          {
            error:
              'Invalid GitHub token. Please check your token format and validity. Token should start with "ghp_" or "github_pat_".',
          },
          { status: 401 }
        );
      }
      return NextResponse.json(
        {
          error: `Failed to validate GitHub token: ${userResponse.status} ${userResponse.statusText}`,
        },
        { status: userResponse.status }
      );
    }

    // Check token scopes
    const scopes =
      userResponse.headers.get("x-oauth-scopes")?.split(", ") || [];
    console.log(`🔑 Token scopes: ${scopes.join(", ")}`);

    // Check if repository exists publicly (without token)
    const publicCheck = await fetch(
      `https://api.github.com/repos/${owner}/${cleanRepoName}`,
      {
        headers: {
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "docs-generator",
        },
      }
    );

    const isPrivateRepo = !publicCheck.ok && publicCheck.status === 404;

    // Validate scopes based on repository type
    if (isPrivateRepo) {
      if (!scopes.includes("repo")) {
        return NextResponse.json(
          {
            error: `This appears to be a private repository, but your GitHub token does not have the required 'repo' scope. Current scopes: ${scopes.join(
              ", "
            )}. Please generate a new token with 'repo' scope at: https://github.com/settings/tokens/new`,
            scopesRequired: ["repo"],
            currentScopes: scopes,
            repositoryType: "private",
          },
          { status: 403 }
        );
      }
    } else {
      if (!scopes.includes("repo") && !scopes.includes("public_repo")) {
        return NextResponse.json(
          {
            error: `Your GitHub token does not have the required scopes. For public repositories, you need 'public_repo' scope. For private repositories, you need 'repo' scope. Current scopes: ${scopes.join(
              ", "
            )}. Please generate a new token at: https://github.com/settings/tokens/new`,
            scopesRequired: isPrivateRepo ? ["repo"] : ["public_repo", "repo"],
            currentScopes: scopes,
            repositoryType: isPrivateRepo ? "private" : "public",
          },
          { status: 403 }
        );
      }
    }

    // Now check repository access with token
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${cleanRepoName}`,
      {
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "docs-generator",
        },
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        return NextResponse.json(
          {
            error:
              "Invalid GitHub token. Please check your token format and validity.",
          },
          { status: 401 }
        );
      } else if (response.status === 403) {
        const responseText = await response.text();
        if (responseText.includes("rate limit")) {
          return NextResponse.json(
            {
              error:
                "GitHub API rate limit exceeded. Please wait a few minutes and try again.",
            },
            { status: 429 }
          );
        }
        return NextResponse.json(
          {
            error: `GitHub token does not have sufficient permissions for this repository. For private repositories, your token needs 'repo' scope. For public repositories, your token needs 'public_repo' or 'repo' scope. Current scopes: ${scopes.join(
              ", "
            )}.`,
            scopesRequired: isPrivateRepo ? ["repo"] : ["public_repo", "repo"],
            currentScopes: scopes,
            repositoryType: isPrivateRepo ? "private" : "public",
          },
          { status: 403 }
        );
      } else if (response.status === 404) {
        return NextResponse.json(
          {
            error: `Repository access denied. This could mean: (1) Repository is private and your token doesn't have the required 'repo' scope, (2) Token doesn't have access to this specific repository, (3) You need to be added as a collaborator, or (4) Repository name is incorrect. Current scopes: ${scopes.join(
              ", "
            )}.`,
            scopesRequired: ["repo"],
            currentScopes: scopes,
            repositoryType: "private",
          },
          { status: 404 }
        );
      } else {
        return NextResponse.json(
          {
            error: `GitHub API error: ${response.status} ${response.statusText}`,
          },
          { status: response.status }
        );
      }
    }

    const repoData = await response.json();

    // Check if user has push access
    if (!repoData.permissions?.push) {
      const requiredScope = repoData.private ? "repo" : "public_repo";
      return NextResponse.json(
        {
          error: `Your GitHub token does not have push access to this repository. This is required to commit and push documentation changes. Please ensure: (1) You have push/write access to the repository, (2) Your token has '${requiredScope}' scope, (3) For organization repos, check if you're a member with write access, (4) If the organization uses SSO, authorize your token for SSO.`,
          permissions: repoData.permissions,
          scopesRequired: [requiredScope],
          currentScopes: scopes,
          repositoryType: repoData.private ? "private" : "public",
        },
        { status: 403 }
      );
    }

    console.log(
      `✅ Repository access test successful for: ${repoData.full_name}`
    );

    return NextResponse.json({
      success: true,
      fullName: repoData.full_name,
      private: repoData.private,
      permissions: {
        push: repoData.permissions?.push || false,
        pull: repoData.permissions?.pull || false,
        admin: repoData.permissions?.admin || false,
      },
      owner: {
        login: repoData.owner.login,
        type: repoData.owner.type,
      },
      tokenScopes: scopes,
      repositoryType: repoData.private ? "private" : "public",
      accessValidation: {
        scopesValid: true,
        pushAccess: true,
        tokenValid: true,
      },
    });
  } catch (error) {
    console.error("Repository access test error:", error);
    return NextResponse.json(
      {
        error: "Failed to test repository access: " + (error as Error).message,
      },
      { status: 500 }
    );
  }
}
