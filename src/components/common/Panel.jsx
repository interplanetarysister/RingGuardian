import React from 'react';

export default function Panel({ title = null, subtitle = null, actions = null, children = null, className = '', bodyClassName = '', dense = false }) {
  return (
    <section className={'rgc-panel overflow-hidden ' + className}>
      {title || actions ? (
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
          <div className="min-w-0">
            {title ? <h2 className="font-heading text-sm font-semibold tracking-tight text-foreground">{title}</h2> : null}
            {subtitle ? <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{subtitle}</p> : null}
          </div>
          {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
        </header>
      ) : null}
      <div className={(dense ? '' : 'p-4 sm:p-5 ') + bodyClassName}>{children}</div>
    </section>
  );
}