type StatusStateProps = {
  title: string;
  description: string;
};

export function LoadingState({ title = "Loading", description }: Partial<StatusStateProps>) {
  return (
    <section aria-busy="true" aria-live="polite" className="status-state">
      <span aria-hidden="true" className="status-state__spinner" />
      <h2 className="status-state__title">{title}</h2>
      {description ? <p className="status-state__description">{description}</p> : null}
    </section>
  );
}

export function EmptyState({ title, description }: StatusStateProps) {
  return (
    <section className="status-state">
      <h2 className="status-state__title">{title}</h2>
      <p className="status-state__description">{description}</p>
    </section>
  );
}

export function ErrorState({ title, description }: StatusStateProps) {
  return (
    <section aria-live="polite" className="status-state status-state--error" role="alert">
      <h2 className="status-state__title">{title}</h2>
      <p className="status-state__description">{description}</p>
    </section>
  );
}
