import React from 'react';

export default function EmptyState({ icon: Icon = null, title, hint = null, action = null }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
      {Icon ? (
        <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-muted/40">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
      ) : null}
      <p className="text-sm font-medium text-foreground">{title}</p>
      {hint ? <p className="max-w-sm text-xs leading-relaxed text-muted-foreground">{hint}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}