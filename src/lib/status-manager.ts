// Shared status manager for documentation generation
// In a production app, this would use Redis or a database

interface GenerationStatus {
  status:
    | "idle"
    | "cloning"
    | "analyzing"
    | "generating"
    | "committing"
    | "completed"
    | "error"
    | "up-to-date"
    | "incremental";
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

let currentStatus: GenerationStatus = {
  status: "idle",
  progress: 0,
  message: "",
  logs: [],
  documentedFiles: 0,
  totalFiles: 0,
  branchUrl: undefined,
};

export function getStatus(): GenerationStatus {
  return { ...currentStatus };
}

export function updateStatus(update: Partial<GenerationStatus>) {
  currentStatus = { ...currentStatus, ...update };
  if (update.message) {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${update.message}`;
    if (!currentStatus.logs.includes(logEntry)) {
      currentStatus.logs.push(logEntry);
      // Keep only last 50 log entries
      if (currentStatus.logs.length > 50) {
        currentStatus.logs = currentStatus.logs.slice(-50);
      }
    }
  }
}

export function resetStatus() {
  currentStatus = {
    status: "idle",
    progress: 0,
    message: "",
    logs: [],
    documentedFiles: 0,
    totalFiles: 0,
    branchUrl: undefined,
  };
}
