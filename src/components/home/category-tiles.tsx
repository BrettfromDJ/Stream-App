import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ColorBlock, type ShapeKind } from "@/components/editorial/color-block";
import { Sup } from "@/components/editorial/editorial";

const TILES: { href: string; title: string; soft: string; color: string; shape: ShapeKind; key: "watch" | "book" | "game" }[] = [
  { href: "/watch", title: "Movies", soft: "& TV", color: "#ff5b3d", shape: "arch", key: "watch" },
  { href: "/books", title: "Books", soft: "To read", color: "#ffd84a", shape: "ring", key: "book" },
  { href: "/games", title: "Games", soft: "To play", color: "#b9b3ff", shape: "stairs", key: "game" },
];

/** Print-poster doorways into each tab, with how many you have of each. */
export function CategoryTiles({ counts }: { counts: { watch: number; book: number; game: number } }) {
  return (
    <section aria-label="Browse" className="gutter grid grid-cols-3 gap-2 md:gap-3">
      {TILES.map((t) => (
        <Link key={t.href} href={t.href} className="group transition-transform active:scale-[0.97]">
          <ColorBlock
            title={
              <>
                {t.title}
                {counts[t.key] > 0 && <Sup>{counts[t.key]}</Sup>}
              </>
            }
            soft={t.soft}
            color={t.color}
            shape={t.shape}
            className="aspect-[3/4] md:aspect-[4/3]"
          >
            <ArrowUpRight className="absolute top-3 right-3 z-10 size-4 opacity-50 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </ColorBlock>
        </Link>
      ))}
    </section>
  );
}
