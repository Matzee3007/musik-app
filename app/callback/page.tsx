"use client";

import { useRouter } from "next/navigation";
import Rueckruf from "@/app/ui/rueckruf";

export default function Callback() {
  const router = useRouter();
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 p-8 text-center">
      <h1 className="font-schild text-4xl text-birne sm:text-5xl">
        Musik-Bingo
      </h1>
      <Rueckruf onFertig={() => router.replace("/")} />
    </main>
  );
}
