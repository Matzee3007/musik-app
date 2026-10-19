export default function Tisch({ onRadDrehen }: { onRadDrehen: () => void }) {
  return (
    <section
      aria-label="Tisch"
      className="flex flex-col items-center gap-4 rounded-xl border border-zinc-300 p-6 dark:border-zinc-700"
    >
      <Knopf onClick={onRadDrehen}>Rad drehen</Knopf>
    </section>
  );
}

function Knopf({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      className="rounded-lg bg-foreground px-6 py-3 text-lg font-semibold text-background"
      onClick={onClick}
    >
      {children}
    </button>
  );
}
