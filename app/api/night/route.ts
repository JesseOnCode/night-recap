import { loadNight } from "@/src/nhl/load-night";

export async function GET() {
  try {
    return Response.json(await loadNight());
  } catch (error) {
    console.error(error);
    return Response.json(
      { message: "NHL-tietoja ei saatu haettua." },
      { status: 502 },
    );
  }
}
