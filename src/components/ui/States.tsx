import { type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  icon?: ReactNode;
}

export function LoadingState({ message = 'Loading...', icon }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      {icon || <Loader2 className="w-8 h-8 text-green-500 animate-spin" />}
      <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">{message}</p>
    </div>
  );
}

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message = 'Something went wrong', onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <p className="text-sm text-red-500">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-outline mt-3 text-sm">
          Try Again
        </button>
      )}
    </div>
  );
}

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {icon && <div className="text-neutral-300 dark:text-neutral-700 mb-3">{icon}</div>}
      <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">{title}</p>
      {description && <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1 max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
