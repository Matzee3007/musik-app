import { Suspense } from "react";
import HandyRaum from "@/app/ui/handy-raum";

// Der Code ist erst beim Aufruf bekannt, mit Cache Components daher hinter Suspense.
export default function Raum({ params }: PageProps<"/raum/[code]">) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-4 py-8 text-center">
      <Suspense>
        {params.then(({ code }) => (
          <HandyRaum code={code} />
        ))}
      </Suspense>
    </main>
  );
}
