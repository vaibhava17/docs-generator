import { NextRequest, NextResponse } from "next/server";
import { GitHubDocsGenerator } from "@/lib/github-docs-generator";

export async function POST(request: NextRequest) {
  try {
    const { repoUrl, githubToken, targetPath } = await request.json();

    // Validate input
    if (!repoUrl) {
      return NextResponse.json(
        { error: "Repository URL is required" },
        { status: 400 }
      );
    }

    // Create a temporary generator instance with dummy AI config for preview
    const generator = new GitHubDocsGenerator(
      { provider: "openai", apiKey: "dummy" },
      { force: true }
    );

    // Clone repository and find files
    await generator.cloneRepository({
      url: repoUrl,
      token: githubToken || undefined,
      targetPath: targetPath,
    });

    const { sourceFiles, existingDocs } = await generator.findSourceFiles(
      targetPath
    );

    // Cleanup
    await generator.cleanup();

    return NextResponse.json({
      files: sourceFiles,
      existingDocs: existingDocs,
      total: sourceFiles.length + existingDocs.length,
    });
  } catch (error) {
    console.error("Preview files error:", error);
    return NextResponse.json(
      { error: "Failed to preview files: " + (error as Error).message },
      { status: 500 }
    );
  }
}
