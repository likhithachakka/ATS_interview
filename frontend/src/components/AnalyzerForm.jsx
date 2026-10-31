import { useRef, useState } from 'react';
import { CloudUpload, FileText, LoaderCircle, Sparkles, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

const MIN_RESUME_CHARS = 80;
const MIN_JD_CHARS = 40;
const ACCEPTED_FILE_TYPES = '.pdf,.docx,.txt,.md';

const formatBytes = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function AnalyzerForm({ onAnalyze, loading }) {
  const [mode, setMode] = useState('paste');
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [localError, setLocalError] = useState(null);
  const fileInputRef = useRef(null);

  const hasResume = mode === 'upload' ? Boolean(file) : resumeText.trim().length >= MIN_RESUME_CHARS;
  const hasJobDescription = jobDescription.trim().length >= MIN_JD_CHARS;
  const canSubmit = hasResume && hasJobDescription && !loading;

  const acceptFile = (candidate) => {
    if (!candidate) return;
    const extension = `.${candidate.name.split('.').pop()?.toLowerCase()}`;
    if (!ACCEPTED_FILE_TYPES.includes(extension)) {
      setLocalError(`"${candidate.name}" is not supported. Use PDF, DOCX, TXT or MD.`);
      return;
    }
    if (candidate.size > 10 * 1024 * 1024) {
      setLocalError('That file is larger than 10 MB.');
      return;
    }
    setLocalError(null);
    setFile(candidate);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragActive(false);
    acceptFile(event.dataTransfer.files?.[0]);
  };

  const handleReset = () => {
    setResumeText('');
    setJobDescription('');
    setFile(null);
    setLocalError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!canSubmit) return;
    onAnalyze({
      resumeFile: mode === 'upload' ? file : null,
      resumeText: mode === 'paste' ? resumeText.trim() : '',
      jobDescription: jobDescription.trim(),
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          Run a new analysis
        </CardTitle>
        <CardDescription>
          Paste or upload your resume, add the job description, and Gemini will score the match.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <Label>1. Your resume</Label>
            <Tabs value={mode} onValueChange={setMode}>
              <TabsList className="w-full">
                <TabsTrigger value="paste" className="flex-1">
                  Paste text
                </TabsTrigger>
                <TabsTrigger value="upload" className="flex-1">
                  Upload file
                </TabsTrigger>
              </TabsList>

              <TabsContent value="paste">
                <Textarea
                  value={resumeText}
                  onChange={(event) => setResumeText(event.target.value)}
                  placeholder="Paste the full text of your resume here — summary, skills, experience, education..."
                  className="min-h-[220px] resize-y scrollbar-thin"
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  {resumeText.trim().length} characters
                  {!hasResume && ` · at least ${MIN_RESUME_CHARS} needed`}
                </p>
              </TabsContent>

              <TabsContent value="upload">
                <div
                  onDragOver={(event) => {
                    event.preventDefault();
                    setDragActive(true);
                  }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors',
                    dragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/60 hover:bg-accent/40'
                  )}
                >
                  <CloudUpload className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm font-medium">Drag &amp; drop your resume, or click to browse</p>
                  <p className="text-xs text-muted-foreground">PDF, DOCX, TXT or MD · up to 10 MB</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={ACCEPTED_FILE_TYPES}
                    className="hidden"
                    onChange={(event) => acceptFile(event.target.files?.[0])}
                  />
                </div>

                {file && (
                  <div className="mt-3 flex items-center justify-between gap-3 rounded-md border border-border bg-accent/40 px-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleReset();
                      }}
                    >
                      <Trash className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-3">
            <Label htmlFor="job-description">2. Job description</Label>
            <Textarea
              id="job-description"
              value={jobDescription}
              onChange={(event) => setJobDescription(event.target.value)}
              placeholder="Paste the full job posting — responsibilities, required skills, qualifications..."
              className="min-h-[200px] resize-y scrollbar-thin"
            />
            <p className="text-xs text-muted-foreground">
              {jobDescription.trim().length} characters
              {!hasJobDescription && ` · at least ${MIN_JD_CHARS} needed`}
            </p>
          </div>

          {localError && (
            <Alert variant="warning">
              <AlertDescription>{localError}</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" size="lg" className="flex-1" disabled={!canSubmit}>
              {loading ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Analyzing with Gemini...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Analyze &amp; generate questions
                </>
              )}
            </Button>
            <Button type="button" variant="outline" size="lg" onClick={handleReset} disabled={loading}>
              Clear
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
