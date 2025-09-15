import { NextRequest, NextResponse } from 'next/server';
import { GitHubDocsGenerator } from '@/lib/github-docs-generator';
import * as fs from 'fs-extra';
import * as path from 'path';
import archiver from 'archiver';

export async function POST(request: NextRequest) {
  try {
    const { repoUrl, githubToken, branchName = 'docs-generation' } = await request.json();

    if (!repoUrl) {
      return NextResponse.json({ error: 'Repository URL is required' }, { status: 400 });
    }

    // Create a temporary generator instance
    const generator = new GitHubDocsGenerator(
      { provider: 'openai', apiKey: 'dummy' },
      { force: true }
    );

    // Clone repository and switch to docs branch
    await generator.cloneRepository({
      url: repoUrl,
      token: githubToken,
      branch: branchName
    });

    // Check if docs directory exists
    const repoPath = generator.getRepoPath();
    const docsPath = path.join(repoPath, 'docs');
    const indexPath = path.join(repoPath, 'DOCUMENTATION_INDEX.md');

    if (!await fs.pathExists(docsPath) && !await fs.pathExists(indexPath)) {
      await generator.cleanup();
      return NextResponse.json({ error: 'No documentation found in the repository' }, { status: 404 });
    }

    // Create a zip archive
    const archive = archiver('zip', { zlib: { level: 9 } });
    const chunks: Buffer[] = [];

    archive.on('data', (chunk) => chunks.push(chunk));
    archive.on('error', (err) => {
      throw err;
    });

    // Add documentation files to archive
    if (await fs.pathExists(docsPath)) {
      archive.directory(docsPath, 'docs');
    }
    
    if (await fs.pathExists(indexPath)) {
      archive.file(indexPath, { name: 'DOCUMENTATION_INDEX.md' });
    }

    await archive.finalize();

    // Wait for archive to complete
    await new Promise((resolve) => {
      archive.on('end', resolve);
    });

    // Cleanup
    await generator.cleanup();

    // Return the zip file
    const buffer = Buffer.concat(chunks);
    const repoName = repoUrl.split('/').pop()?.replace('.git', '') || 'documentation';

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${repoName}-documentation.zip"`,
        'Content-Length': buffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('Download docs error:', error);
    return NextResponse.json(
      { error: 'Failed to download documentation: ' + (error as Error).message },
      { status: 500 }
    );
  }
}