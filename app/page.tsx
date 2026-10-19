import SpielAnsicht from "@/app/ui/spiel-ansicht";
import { SONGLISTE } from "@/lib/songliste";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 p-8 text-center">
      <h1 className="text-4xl font-semibold">Musik-App</h1>
      <SpielAnsicht songs={SONGLISTE} />
    </main>
  );
}
