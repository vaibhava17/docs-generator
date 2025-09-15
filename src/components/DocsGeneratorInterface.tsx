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
import { Github, FileText, Settings, Play, Download, Eye, AlertCircle, CheckCircle, Clock, Zap, TestTube, Trash2 } from 'lucide-react';

interface GenerationStatus {
  status: 'idle' | 'cloning' | 'analyzing' | 'generating' | 'committing' | 'completed' | 'error' | 'up-to-date' | 'incremental';
  progress: number;
  message: string;
  logs: string[];
  documentedFiles: number;
  totalFiles: number;
  branchUrl?: string;
  isExistingBranch?: boolean;
  hasExistingDocs?: boolean;
  changedFiles?: number;
  newFiles?: number;
  isIncremental?: boolean;
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
  const [accessTestResult, setAccessTestResult] = useState<{
    success: boolean, 
    message: string,
    tokenScopes?: string[],
    repositoryType?: 'public' | 'private',
    scopesRequired?: string[]
  } | null>(null);
  const [cleaningUp, setCleaningUp] = useState(false);

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
          message: `✅ Repository access confirmed! You have ${result.permissions.push ? 'write' : 'read-only'} access to ${result.fullName} (${result.repositoryType}).`,
          tokenScopes: result.tokenScopes,
          repositoryType: result.repositoryType,
          scopesRequired: result.repositoryType === 'private' ? ['repo'] : ['public_repo', 'repo']
        });
      } else {
        setAccessTestResult({
          success: false,
          message: `❌ ${result.error || 'Repository access test failed'}`,
          tokenScopes: result.currentScopes,
          repositoryType: result.repositoryType,
          scopesRequired: result.scopesRequired
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

  const handleCleanup = async () => {
    if (!confirm('This will clean up all temporary repository files. Are you sure?')) {
      return;
    }

    setCleaningUp(true);
    try {
      const response = await fetch('/api/cleanup-temp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const result = await response.json();
      
      if (response.ok) {
        alert('✅ Temporary repositories cleaned successfully!');
      } else {
        alert(`❌ Cleanup failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Cleanup error:', error);
      alert('❌ Failed to cleanup temporary repositories. Please try again.');
    } finally {
      setCleaningUp(false);
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
      case 'up-to-date': return <CheckCircle className="w-5 h-5 text-blue-500" />;
      case 'incremental': return <Zap className="w-5 h-5 text-orange-500" />;
      case 'error': return <AlertCircle className="w-5 h-5 text-red-500" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  const getStatusColor = () => {
    switch (status.status) {
      case 'completed': return 'bg-green-500';
      case 'up-to-date': return 'bg-blue-500';
      case 'incremental': return 'bg-orange-500';
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
              <div className="text-xs text-muted-foreground space-y-2">
                <p>Required to push documentation to any repository.</p>
                
                <div className="space-y-1">
                  <p><strong>Token Scope Requirements:</strong></p>
                  <div className="grid grid-cols-1 gap-2 ml-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive" className="text-xs">repo</Badge>
                      <span>Required for private repositories (full control)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="default" className="text-xs">public_repo</Badge>
                      <span>Sufficient for public repositories</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">workflow</Badge>
                      <span>Optional - Update GitHub workflows</span>
                    </div>
                  </div>
                </div>
                
                <div className="p-2 bg-blue-50 border border-blue-200 rounded">
                  <p className="text-blue-800 font-semibold text-xs mb-1">💡 Recommendation:</p>
                  <p className="text-blue-700 text-xs">
                    Use <code className="bg-blue-100 px-1 rounded">repo</code> scope for all repositories to avoid permission issues.
                  </p>
                </div>
                
                <div className="flex gap-2 flex-wrap">
                  <a 
                    href="https://github.com/settings/tokens/new?scopes=repo&description=AI%20Docs%20Generator%20-%20All%20Repos" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline text-xs"
                  >
                    Generate token (all repos) →
                  </a>
                  <a 
                    href="https://github.com/settings/tokens/new?scopes=public_repo&description=AI%20Docs%20Generator%20-%20Public%20Only" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline text-xs"
                  >
                    Generate token (public only) →
                  </a>
                </div>
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
                <div className={`p-4 rounded-lg border space-y-3 ${
                  accessTestResult.success 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  <p className={`text-sm font-mono ${
                    accessTestResult.success ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {accessTestResult.message}
                  </p>
                  
                  {accessTestResult.tokenScopes && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-gray-600">Current Token Scopes:</span>
                        <div className="flex gap-1 flex-wrap">
                          {accessTestResult.tokenScopes.map((scope, idx) => (
                            <Badge 
                              key={idx} 
                              variant={accessTestResult.scopesRequired?.includes(scope) ? "default" : "secondary"}
                              className="text-xs"
                            >
                              {scope}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      {accessTestResult.scopesRequired && !accessTestResult.success && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-gray-600">Required Scopes:</span>
                          <div className="flex gap-1 flex-wrap">
                            {accessTestResult.scopesRequired.map((scope, idx) => (
                              <Badge key={idx} variant="destructive" className="text-xs">
                                {scope}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {accessTestResult.repositoryType && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-gray-600">Repository Type:</span>
                          <Badge variant="outline" className="text-xs">
                            {accessTestResult.repositoryType}
                          </Badge>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {!accessTestResult.success && accessTestResult.repositoryType === 'private' && (
                    <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded text-yellow-800">
                      <p className="text-xs font-semibold mb-1">💡 Private Repository Fix:</p>
                      <p className="text-xs">
                        Your token needs the <code className="bg-yellow-100 px-1 rounded">repo</code> scope for private repositories. 
                        <a 
                          href="https://github.com/settings/tokens/new?scopes=repo&description=AI%20Docs%20Generator%20-%20Private%20Repos" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="ml-1 text-yellow-900 underline hover:text-yellow-700"
                        >
                          Generate new token with repo scope →
                        </a>
                      </p>
                    </div>
                  )}
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

          {/* Smart Documentation Info */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Smart Documentation Features</h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-3">
                <Zap className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="space-y-2">
                  <h4 className="font-semibold text-blue-800">Incremental Updates</h4>
                  <p className="text-sm text-blue-700">
                    The system automatically detects existing documentation branches and only processes changed or new files, 
                    making subsequent runs much faster.
                  </p>
                </div>
              </div>
              
              <div className="ml-8 space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs bg-green-50 border-green-200 text-green-700">
                    ✓ Existing Branch Detection
                  </Badge>
                  <Badge variant="outline" className="text-xs bg-orange-50 border-orange-200 text-orange-700">
                    ⚡ Changed Files Only
                  </Badge>
                  <Badge variant="outline" className="text-xs bg-blue-50 border-blue-200 text-blue-700">
                    🔄 Auto Merge from Main
                  </Badge>
                </div>
                <p className="text-xs text-blue-600">
                  First run: Documents all files • Subsequent runs: Only updates changed files
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  💡 Temporary files are automatically cleaned after successful completion
                </p>
              </div>
            </div>
          </div>

          {/* Advanced Options */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Advanced Options</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="overwrite">Force Full Regeneration</Label>
                  <p className="text-sm text-muted-foreground">
                    Regenerate all documentation files instead of incremental updates
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
            <Button 
              onClick={handleCleanup} 
              disabled={cleaningUp}
              variant="outline" 
              className="flex items-center gap-2 text-orange-600 hover:text-orange-700"
            >
              <Trash2 className="w-4 h-4" />
              {cleaningUp ? 'Cleaning...' : 'Clean Temp Files'}
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
              {status.status === 'up-to-date' ? 'Documentation Up to Date' :
               status.status === 'incremental' ? 'Incremental Update' :
               status.status === 'error' ? 'Generation Failed' : 
               'Documentation Generation'}
            </CardTitle>
            <CardDescription>
              {status.message}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Smart Branch Status */}
            {(status.isExistingBranch || status.hasExistingDocs || status.isIncremental) && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-blue-600" />
                  <span className="font-semibold text-blue-800">Smart Documentation Mode</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {status.isExistingBranch && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-blue-700">Existing branch detected</span>
                    </div>
                  )}
                  
                  {status.hasExistingDocs && (
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-blue-700">Documentation found</span>
                    </div>
                  )}
                  
                  {status.isIncremental && (
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-orange-600" />
                      <span className="text-sm text-blue-700">Incremental mode</span>
                    </div>
                  )}
                </div>

                {(status.changedFiles !== undefined || status.newFiles !== undefined) && (
                  <div className="flex gap-4">
                    {status.changedFiles !== undefined && status.changedFiles > 0 && (
                      <Badge variant="outline" className="bg-orange-50 border-orange-200 text-orange-700">
                        🔄 {status.changedFiles} changed files
                      </Badge>
                    )}
                    {status.newFiles !== undefined && status.newFiles > 0 && (
                      <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700">
                        🆕 {status.newFiles} new files
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            )}

            {status.status !== 'up-to-date' && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{status.progress}%</span>
                </div>
                <Progress value={status.progress} className={getStatusColor()} />
              </div>
            )}

            {status.totalFiles > 0 && (
              <div className="flex gap-4">
                <Badge variant="secondary">
                  Total Files: {status.totalFiles}
                </Badge>
                <Badge variant="default">
                  Documented: {status.documentedFiles}
                </Badge>
                {status.isIncremental && (
                  <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700">
                    ⚡ Incremental
                  </Badge>
                )}
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

            {(status.status === 'completed' || status.status === 'up-to-date') && status.branchUrl && (
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

            {status.status === 'up-to-date' && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <h4 className="font-semibold text-green-800">Documentation Already Up to Date!</h4>
                </div>
                <p className="text-sm text-green-700 mb-3">
                  No changes detected since the last documentation generation. Your docs are current with the latest code.
                </p>
                <div className="flex items-center gap-2 text-xs text-green-600">
                  <Zap className="w-4 h-4" />
                  <span>Smart incremental updates saved you time by detecting no changes needed</span>
                </div>
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
                  <ul className="text-sm text-yellow-700 space-y-2">
                    <li className="flex items-start gap-2">
                      <span>•</span>
                      <div>
                        <strong>Private Repository Issues:</strong> Ensure your token has the 
                        <Badge variant="destructive" className="mx-1 text-xs">repo</Badge> 
                        scope (not just <code>public_repo</code>)
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span>•</span>
                      <div>
                        <strong>Permission Denied:</strong> You need to be a collaborator with write access to the repository
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span>•</span>
                      <div>
                        <strong>Organization Repos:</strong> Check if the organization requires SSO authorization for your token
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span>•</span>
                      <div>
                        <strong>Token Issues:</strong> Try generating a new token if the current one is old or expired
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span>•</span>
                      <div>
                        <strong>Quick Fix:</strong> Use the "Test Access" button above to verify your token permissions
                      </div>
                    </li>
                  </ul>
                  
                  <div className="mt-3 p-2 bg-white border border-yellow-300 rounded">
                    <p className="text-xs text-yellow-800">
                      <strong>Common Issue:</strong> Many users accidentally select <code>public_repo</code> instead of <code>repo</code> 
                      when creating tokens for private repositories. The <code>repo</code> scope includes <code>public_repo</code> 
                      and works for all repository types.
                    </p>
                  </div>
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
                <li className="space-y-1">
                  <div>Select scopes based on your needs:</div>
                  <div className="ml-4 space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive" className="text-xs">repo</Badge>
                      <span className="text-xs">For private repositories (includes public_repo)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="default" className="text-xs">public_repo</Badge>
                      <span className="text-xs">For public repositories only</span>
                    </div>
                  </div>
                </li>
                <li>Click &quot;Generate token&quot; and copy it immediately</li>
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