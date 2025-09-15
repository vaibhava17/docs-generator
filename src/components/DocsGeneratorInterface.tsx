'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Github, FileText, Settings, Play, Download, Eye, AlertCircle, CheckCircle, Clock, Zap, TestTube } from 'lucide-react';

interface GenerationStatus {
  status: 'idle' | 'cloning' | 'analyzing' | 'generating' | 'committing' | 'completed' | 'error';
  progress: number;
  message: string;
  logs: string[];
  documentedFiles: number;
  totalFiles: number;
  branchUrl?: string;
}

interface FormData {
  repoUrl: string;
  githubToken: string;
  targetPath: string;
  branchName: string;
  aiProvider: 'openai' | 'gemini';
  apiKey: string;
  overwrite: boolean;
  force: boolean;
}

export default function DocsGeneratorInterface() {
  const [formData, setFormData] = useState<FormData>({
    repoUrl: '',
    githubToken: '',
    targetPath: '',
    branchName: 'docs-generation',
    aiProvider: 'openai',
    apiKey: '',
    overwrite: false,
    force: false
  });

  const [status, setStatus] = useState<GenerationStatus>({
    status: 'idle',
    progress: 0,
    message: '',
    logs: [],
    documentedFiles: 0,
    totalFiles: 0
  });

  const [showPreview, setShowPreview] = useState(false);
  const [previewFiles, setPreviewFiles] = useState<string[]>([]);
  const [testingAccess, setTestingAccess] = useState(false);
  const [accessTestResult, setAccessTestResult] = useState<{success: boolean, message: string} | null>(null);

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear access test result when form changes
    if (field === 'repoUrl' || field === 'githubToken') {
      setAccessTestResult(null);
    }
  };

  const handleTestAccess = async () => {
    if (!formData.repoUrl || !formData.githubToken) {
      setAccessTestResult({
        success: false,
        message: 'Please provide both Repository URL and GitHub Token to test access.'
      });
      return;
    }

    setTestingAccess(true);
    setAccessTestResult(null);

    try {
      const response = await fetch('/api/test-repo-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repoUrl: formData.repoUrl,
          githubToken: formData.githubToken
        })
      });

      const result = await response.json();

      if (response.ok) {
        setAccessTestResult({
          success: true,
          message: `✅ Repository access confirmed! You have ${result.permissions.push ? 'write' : 'read-only'} access to ${result.fullName}.`
        });
      } else {
        setAccessTestResult({
          success: false,
          message: `❌ ${result.error || 'Repository access test failed'}`
        });
      }
    } catch (error) {
      setAccessTestResult({
        success: false,
        message: `❌ Test failed: ${(error as Error).message}`
      });
    } finally {
      setTestingAccess(false);
    }
  };

  const validateForm = (): string[] => {
    const errors: string[] = [];
    
    if (!formData.repoUrl) {
      errors.push('Repository URL is required');
    } else if (!formData.repoUrl.match(/^https:\/\/github\.com\/[^\/]+\/[^\/]+$/)) {
      errors.push('Invalid GitHub repository URL format');
    }
    
    if (!formData.githubToken) {
      errors.push('GitHub Token is required to push documentation to any repository');
    }
    
    if (!formData.apiKey) {
      errors.push(`${formData.aiProvider.toUpperCase()} API key is required`);
    }
    
    if (!formData.branchName) {
      errors.push('Branch name is required');
    }
    
    return errors;
  };

  const handlePreview = async () => {
    const errors = validateForm();
    if (errors.length > 0) {
      alert('Please fix the following errors:\n' + errors.join('\n'));
      return;
    }

    setShowPreview(true);
    try {
      const response = await fetch('/api/preview-files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repoUrl: formData.repoUrl,
          githubToken: formData.githubToken || undefined,
          targetPath: formData.targetPath || undefined
        })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch file preview');
      }

      const data = await response.json();
      setPreviewFiles(data.files);
    } catch (error) {
      console.error('Preview error:', error);
      alert('Failed to preview files. Please check your repository URL and token.');
    }
  };

  const handleGenerate = async () => {
    const errors = validateForm();
    if (errors.length > 0) {
      setStatus({
        status: 'error',
        progress: 0,
        message: '⚠️ Form Validation Failed: Please check the required fields and try again.',
        logs: errors.map(error => `❌ ${error}`),
        documentedFiles: 0,
        totalFiles: 0
      });
      return;
    }

    setStatus({
      status: 'cloning',
      progress: 10,
      message: 'Cloning repository...',
      logs: ['Starting documentation generation...'],
      documentedFiles: 0,
      totalFiles: 0
    });

    try {
      const response = await fetch('/api/generate-docs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Failed to start documentation generation');
      }

      // Start polling for status updates
      const pollStatus = async () => {
        try {
          const statusResponse = await fetch('/api/generation-status');
          if (statusResponse.ok) {
            const statusData = await statusResponse.json();
            setStatus(statusData);
            
            if (statusData.status !== 'completed' && statusData.status !== 'error') {
              setTimeout(pollStatus, 1000);
            }
          }
        } catch (error) {
          console.error('Status polling error:', error);
        }
      };

      setTimeout(pollStatus, 1000);
    } catch (error) {
      console.error('Generation error:', error);
      setStatus({
        status: 'error',
        progress: 0,
        message: 'Failed to start documentation generation',
        logs: ['Error: ' + (error as Error).message],
        documentedFiles: 0,
        totalFiles: 0
      });
    }
  };

  const handleDownload = async () => {
    try {
      const response = await fetch('/api/download-docs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repoUrl: formData.repoUrl,
          githubToken: formData.githubToken || undefined,
          branchName: formData.branchName
        })
      });

      if (!response.ok) {
        throw new Error('Failed to download documentation');
      }

      // Create download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${formData.repoUrl.split('/').pop()?.replace('.git', '') || 'documentation'}-docs.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download documentation. Please try again.');
    }
  };

  const getStatusIcon = () => {
    switch (status.status) {
      case 'idle': return <FileText className="w-5 h-5" />;
      case 'cloning': return <Github className="w-5 h-5 animate-spin" />;
      case 'analyzing': return <Eye className="w-5 h-5 animate-pulse" />;
      case 'generating': return <Zap className="w-5 h-5 animate-bounce" />;
      case 'committing': return <Clock className="w-5 h-5 animate-spin" />;
      case 'completed': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error': return <AlertCircle className="w-5 h-5 text-red-500" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  const getStatusColor = () => {
    switch (status.status) {
      case 'completed': return 'bg-green-500';
      case 'error': return 'bg-red-500';
      case 'generating': return 'bg-blue-500';
      default: return 'bg-primary';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Configuration Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Repository Configuration
          </CardTitle>
          <CardDescription>
            Configure your GitHub repository and AI settings to generate documentation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Repository Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="repoUrl">Repository URL *</Label>
              <Input
                id="repoUrl"
                placeholder="https://github.com/owner/repo"
                value={formData.repoUrl}
                onChange={(e) => handleInputChange('repoUrl', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="githubToken">GitHub Token (Required for Push) *</Label>
              <Input
                id="githubToken"
                type="password"
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                value={formData.githubToken}
                onChange={(e) => handleInputChange('githubToken', e.target.value)}
              />
              <div className="text-xs text-muted-foreground space-y-1">
                <p>Required to push documentation to any repository.</p>
                <p><strong>Required token permissions:</strong></p>
                <ul className="list-disc list-inside ml-2 space-y-1">
                  <li><code>repo</code> - Full control of private repositories</li>
                  <li><code>public_repo</code> - Access public repositories</li>
                  <li><code>workflow</code> - Update GitHub Action workflows (if needed)</li>
                </ul>
                <p>
                  <a 
                    href="https://github.com/settings/tokens/new?scopes=repo,public_repo,workflow&description=AI%20Docs%20Generator" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    Generate token with correct permissions →
                  </a>
                </p>
              </div>
            </div>
          </div>

          {/* Repository Access Test */}
          {formData.repoUrl && formData.githubToken && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Repository Access Test</Label>
                <Button 
                  onClick={handleTestAccess} 
                  disabled={testingAccess}
                  variant="outline" 
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <TestTube className="w-4 h-4" />
                  {testingAccess ? 'Testing...' : 'Test Access'}
                </Button>
              </div>
              
              {accessTestResult && (
                <div className={`p-3 rounded-lg border ${
                  accessTestResult.success 
                    ? 'bg-green-50 border-green-200 text-green-700' 
                    : 'bg-red-50 border-red-200 text-red-700'
                }`}>
                  <p className="text-sm font-mono">{accessTestResult.message}</p>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="targetPath">Target Directory (optional)</Label>
              <Input
                id="targetPath"
                placeholder="src or leave empty for entire repo"
                value={formData.targetPath}
                onChange={(e) => handleInputChange('targetPath', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="branchName">Documentation Branch *</Label>
              <Input
                id="branchName"
                placeholder="docs-generation"
                value={formData.branchName}
                onChange={(e) => handleInputChange('branchName', e.target.value)}
              />
            </div>
          </div>

          {/* AI Settings */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">AI Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="aiProvider">AI Provider *</Label>
                <Select value={formData.aiProvider} onValueChange={(value: 'openai' | 'gemini') => handleInputChange('aiProvider', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="openai">OpenAI GPT-4</SelectItem>
                    <SelectItem value="gemini">Google Gemini 1.5 Flash</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="apiKey">
                  {formData.aiProvider === 'openai' ? 'OpenAI' : 'Gemini'} API Key *
                </Label>
                <Input
                  id="apiKey"
                  type="password"
                  placeholder={formData.aiProvider === 'openai' ? 'sk-...' : 'AI...'}
                  value={formData.apiKey}
                  onChange={(e) => handleInputChange('apiKey', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Advanced Options */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Advanced Options</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="overwrite">Overwrite Existing Documentation</Label>
                  <p className="text-sm text-muted-foreground">
                    Replace existing documentation files if they exist
                  </p>
                </div>
                <Switch
                  id="overwrite"
                  checked={formData.overwrite}
                  onCheckedChange={(checked) => handleInputChange('overwrite', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="force">Skip Confirmations</Label>
                  <p className="text-sm text-muted-foreground">
                    Proceed without confirmation prompts
                  </p>
                </div>
                <Switch
                  id="force"
                  checked={formData.force}
                  onCheckedChange={(checked) => handleInputChange('force', checked)}
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-6 border-t">
            <Button onClick={handlePreview} variant="outline" className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Preview Files
            </Button>
            <Button 
              onClick={handleGenerate} 
              disabled={status.status !== 'idle'}
              className="flex items-center gap-2"
            >
              <Play className="w-4 h-4" />
              Generate Documentation
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* File Preview Dialog */}
      <AlertDialog open={showPreview} onOpenChange={setShowPreview}>
        <AlertDialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>Files to be documented</AlertDialogTitle>
            <AlertDialogDescription>
              The following {previewFiles.length} files will be processed:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="max-h-60 overflow-y-auto">
            <div className="space-y-1">
              {previewFiles.map((file, index) => (
                <div key={index} className="text-sm font-mono bg-muted p-2 rounded">
                  {file}
                </div>
              ))}
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
            <AlertDialogAction onClick={handleGenerate}>
              Generate Documentation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Progress Display */}
      {status.status !== 'idle' && (
        <Card className={status.status === 'error' ? 'border-red-200 bg-red-50/50' : ''}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getStatusIcon()}
              Documentation Generation {status.status === 'error' ? 'Failed' : 'Progress'}
            </CardTitle>
            <CardDescription>
              {status.message}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{status.progress}%</span>
              </div>
              <Progress value={status.progress} className={getStatusColor()} />
            </div>

            {status.totalFiles > 0 && (
              <div className="flex gap-4">
                <Badge variant="secondary">
                  Total Files: {status.totalFiles}
                </Badge>
                <Badge variant="default">
                  Documented: {status.documentedFiles}
                </Badge>
              </div>
            )}

            {status.logs.length > 0 && (
              <div className="space-y-2">
                <Label>Activity Log</Label>
                <div className="bg-muted p-4 rounded-lg max-h-40 overflow-y-auto">
                  {status.logs.map((log, index) => (
                    <div key={index} className="text-sm font-mono">
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {status.status === 'completed' && status.branchUrl && (
              <div className="flex gap-4">
                <Button asChild variant="default">
                  <a href={status.branchUrl} target="_blank" rel="noopener noreferrer">
                    <Github className="w-4 h-4 mr-2" />
                    View Documentation Branch
                  </a>
                </Button>
                <Button variant="outline" onClick={handleDownload}>
                  <Download className="w-4 h-4 mr-2" />
                  Download Documentation
                </Button>
              </div>
            )}

            {status.status === 'error' && (
              <div className="space-y-4">
                {status.documentedFiles > 0 && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-semibold text-blue-800 mb-2">✅ Partial Success</h4>
                    <p className="text-sm text-blue-700">
                      Successfully documented {status.documentedFiles} out of {status.totalFiles} files before the error occurred. 
                      You can retry to continue with the remaining files.
                    </p>
                  </div>
                )}
                
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h4 className="font-semibold text-yellow-800 mb-2">💡 Troubleshooting Tips:</h4>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• Check that your GitHub token has the required permissions (repo, public_repo)</li>
                    <li>• Verify the repository URL is correct and accessible</li>
                    <li>• Ensure you have push access to the repository</li>
                    <li>• For private repos, confirm your token has full repo scope</li>
                    <li>• Try generating a new GitHub token if the current one is old</li>
                  </ul>
                </div>
                
                <div className="flex gap-4">
                  <Button onClick={handleGenerate} variant="default" className="flex items-center gap-2">
                    <Play className="w-4 h-4" />
                    {status.documentedFiles > 0 ? 'Continue Generation' : 'Retry Generation'}
                  </Button>
                  <Button 
                    onClick={() => setStatus({
                      status: 'idle',
                      progress: 0,
                      message: '',
                      logs: [],
                      documentedFiles: 0,
                      totalFiles: 0
                    })} 
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <AlertCircle className="w-4 h-4" />
                    Reset
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* GitHub Token Setup Guide */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Github className="w-5 h-5" />
            GitHub Token Setup Guide
          </CardTitle>
          <CardDescription>
            Follow these steps to create a GitHub Personal Access Token with the correct permissions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-semibold">Quick Setup:</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Click the &quot;Generate token&quot; link above</li>
                <li>Sign in to GitHub if prompted</li>
                <li>Verify the required scopes are selected</li>
                <li>Set expiration (90 days recommended)</li>
                <li>Click &quot;Generate token&quot;</li>
                <li>Copy the token and paste it above</li>
              </ol>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold">Manual Setup:</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Go to GitHub Settings → Developer settings</li>
                <li>Click &quot;Personal access tokens&quot; → &quot;Tokens (classic)&quot;</li>
                <li>Click &quot;Generate new token&quot; → &quot;Generate new token (classic)&quot;</li>
                <li>Add description: &quot;AI Docs Generator&quot;</li>
                <li>Select scopes: <code>repo</code>, <code>public_repo</code>, <code>workflow</code></li>
                <li>Click &quot;Generate token&quot; and copy it</li>
              </ol>
            </div>
          </div>
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Important:</strong> Copy your token immediately as it won&apos;t be shown again. 
              Store it securely and never share it publicly.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Supported File Types */}
      <Card>
        <CardHeader>
          <CardTitle>Supported File Types</CardTitle>
          <CardDescription>
            The following programming languages and file types are supported for documentation generation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              'JavaScript (.js, .jsx)',
              'TypeScript (.ts, .tsx)',
              'Python (.py)',
              'Java (.java)',
              'C/C++ (.c, .cpp, .cc)',
              'Go (.go)',
              'Rust (.rs)',
              'PHP (.php)',
              'Ruby (.rb)',
              'C# (.cs)',
              'Swift (.swift)',
              'Kotlin (.kt)',
              'Scala (.scala)',
              'Vue (.vue)',
              'Svelte (.svelte)',
              'And more...'
            ].map((type, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {type}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}