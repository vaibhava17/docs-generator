import { NextRequest, NextResponse } from 'next/server';
import { GitHubDocsGenerator } from '@/lib/github-docs-generator';
import { updateStatus, resetStatus } from '@/lib/status-manager';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.json();
    const { repoUrl, githubToken, targetPath, branchName, aiProvider, apiKey, overwrite, force } = formData;

    // Validate input
    if (!repoUrl || !apiKey || !branchName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Reset status
    resetStatus();
    updateStatus({
      status: 'cloning',
      progress: 0,
      message: 'Starting documentation generation...'
    });

    // Start generation in background
    generateDocumentationAsync(formData);

    return NextResponse.json({ message: 'Documentation generation started' });

  } catch (error) {
    console.error('Generate docs error:', error);
    updateStatus({
      status: 'error',
      message: 'Failed to start documentation generation: ' + (error as Error).message
    });
    return NextResponse.json(
      { error: 'Failed to start documentation generation' },
      { status: 500 }
    );
  }
}

async function generateDocumentationAsync(formData: {
  repoUrl: string;
  githubToken: string;
  targetPath?: string;
  branchName: string;
  aiProvider: 'openai' | 'gemini';
  apiKey: string;
  overwrite?: boolean;
  force?: boolean;
}) {
  const { repoUrl, githubToken, targetPath, branchName, aiProvider, apiKey, overwrite, force } = formData;
  
  console.log('🔍 Starting generation with token:', githubToken ? '***provided***' : 'NOT PROVIDED');

  try {
    updateStatus({
      status: 'cloning',
      progress: 10,
      message: 'Cloning repository...'
    });

    // Create generator instance
    const generator = new GitHubDocsGenerator(
      { provider: aiProvider, apiKey },
      { overwrite, force }
    );

    // Clone repository
    await generator.cloneRepository({
      url: repoUrl,
      token: githubToken,
      targetPath: targetPath,
      branch: branchName
    });

    updateStatus({
      status: 'analyzing',
      progress: 20,
      message: 'Creating documentation branch...'
    });

    // Create documentation branch
    await generator.createDocumentationBranch(branchName);

    updateStatus({
      status: 'analyzing',
      progress: 30,
      message: 'Analyzing repository files...'
    });

    // Find source files
    const { sourceFiles } = await generator.findSourceFiles(targetPath);
    
    updateStatus({
      totalFiles: sourceFiles.length,
      progress: 40,
      message: `Found ${sourceFiles.length} files to document`
    });

    if (sourceFiles.length === 0) {
      updateStatus({
        status: 'completed',
        progress: 100,
        message: 'All files already have documentation!'
      });
      await generator.cleanup();
      return;
    }

    updateStatus({
      status: 'generating',
      progress: 50,
      message: 'Generating AI documentation...'
    });

    // Generate documentation for each file
    const documentedFiles: string[] = [];
    const failedFiles: string[] = [];

    for (let i = 0; i < sourceFiles.length; i++) {
      const filePath = sourceFiles[i];
      const progressPercent = 50 + Math.floor((i / sourceFiles.length) * 30);
      
      updateStatus({
        progress: progressPercent,
        message: `Processing file ${i + 1}/${sourceFiles.length}: ${filePath}`
      });

      try {
        const doc = await generator.generateDocumentation(filePath);
        if (doc) {
          await generator.saveDocumentation(filePath, doc);
          documentedFiles.push(filePath);
          updateStatus({
            documentedFiles: documentedFiles.length,
            message: `✅ Documented: ${filePath}`
          });
        } else {
          failedFiles.push(filePath);
          updateStatus({
            message: `❌ Failed to document: ${filePath}`
          });
        }
      } catch (error) {
        failedFiles.push(filePath);
        updateStatus({
          message: `❌ Error documenting ${filePath}: ${(error as Error).message}`
        });
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    updateStatus({
      status: 'committing',
      progress: 85,
      message: 'Generating documentation index...'
    });

    // Generate index
    if (documentedFiles.length > 0) {
      await generator.generateIndex(documentedFiles);
    }

    updateStatus({
      progress: 95,
      message: 'Committing and pushing changes...'
    });

    // Commit and push changes
    await generator.commitAndPush(branchName, { url: repoUrl, token: githubToken });

    // Extract repository info for branch URL
    const repoMatch = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    const branchUrl = repoMatch 
      ? `https://github.com/${repoMatch[1]}/${repoMatch[2]}/tree/${branchName}`
      : undefined;

    updateStatus({
      status: 'completed',
      progress: 100,
      message: `🎉 Documentation generation completed! Successfully documented ${documentedFiles.length} files.`,
      branchUrl
    });

    if (failedFiles.length > 0) {
      updateStatus({
        message: `⚠️ ${failedFiles.length} files failed to process: ${failedFiles.slice(0, 3).join(', ')}${failedFiles.length > 3 ? '...' : ''}`
      });
    }

    // Cleanup
    await generator.cleanup();

  } catch (error) {
    console.error('Documentation generation error:', error);
    
    let errorMessage = 'Documentation generation failed: ' + (error as Error).message;
    
    // Provide more specific error guidance
    if (error instanceof Error) {
      if (error.message.includes('403') || error.message.includes('denied')) {
        errorMessage = '🔑 GitHub Permission Error: ' + error.message + '\n\nPlease check your GitHub token permissions and try again.';
      } else if (error.message.includes('401') || error.message.includes('authentication')) {
        errorMessage = '🔐 GitHub Authentication Error: ' + error.message + '\n\nYour GitHub token may be invalid or expired.';
      } else if (error.message.includes('404') || error.message.includes('not found')) {
        errorMessage = '🔍 Repository Not Found: ' + error.message + '\n\nPlease verify the repository URL and your access permissions.';
      } else if (error.message.includes('non-fast-forward') || error.message.includes('rejected')) {
        errorMessage = '🔄 Branch Sync Issue: ' + error.message + '\n\nThe documentation branch has newer commits. Click "Retry Generation" - the system will automatically pull the latest changes and retry.';
      } else if (error.message.includes('conflict')) {
        errorMessage = '⚠️ Merge Conflict: ' + error.message + '\n\nThere were conflicts when merging documentation updates. Please try generating again or manually resolve conflicts in the branch.';
      } else if (error.message.includes('API key') || error.message.includes('OpenAI') || error.message.includes('Gemini')) {
        errorMessage = '🤖 AI Service Error: ' + error.message + '\n\nPlease check your AI API key and try again.';
      }
    }
    
    updateStatus({
      status: 'error',
      message: errorMessage
    });
  }
}