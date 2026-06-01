export type ValidationLevel = 'warn' | 'error';

export type ValidationIssue = {
  level: ValidationLevel;
  code: string;
  message: string;
};

export type ValidationResult = {
  issues: ValidationIssue[];
  passed: boolean;
};

export function createResult(issues: ValidationIssue[]): ValidationResult {
  const hasErrors = issues.some((issue) => issue.level === 'error');
  return {
    issues,
    passed: !hasErrors,
  };
}

export function mergeResults(...results: ValidationResult[]): ValidationResult {
  const issues = results.flatMap((result) => result.issues);
  return createResult(issues);
}
