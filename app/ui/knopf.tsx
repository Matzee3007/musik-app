// Einheitlicher Knopf: "haupt" für den nächsten Schritt im Spiel, "neben" für alles andere.
export default function Knopf({
  onClick,
  children,
  art = "haupt",
  disabled,
}: {
  onClick: () => void;
  children: React.ReactNode;
  art?: "haupt" | "neben";
  disabled?: boolean;
}) {
  const farbe =
    art === "haupt"
      ? "border-2 border-transparent bg-birne text-nacht"
      : "border-2 border-licht text-licht";
  return (
    <button
      className={`${farbe} rounded-lg px-6 py-3 text-lg font-semibold outline-birne focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-40`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
