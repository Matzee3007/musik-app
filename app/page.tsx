import Start from "@/app/ui/start";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 p-8 text-center">
      <h1 className="font-schild text-5xl text-birne">Musik-Bingo</h1>
      <Start />
    </main>
  );
}
