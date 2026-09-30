import { getLibraryIndex } from "@/lib/library/queries";
import { cardFromResult } from "@/lib/media/card";
import type { MediaSearchResult } from "@/lib/media/types";
import { MediaCard } from "@/components/media/media-card";
import { Row, ROW_SIZES } from "@/components/media/row";
import { CountdownCard } from "./countdown-card";

type Items = MediaSearchResult[] | Promise<MediaSearchResult[]>;

interface DiscoverRowProps {
  title: string;
  subtitle?: string;
  items: Items;
  variant?: "poster" | "ranked" | "countdown";
  /** Show release dates on the posters (upcoming rows). */
  dates?: boolean;
  href?: string;
  limit?: number;
}

const SHORT = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
const WITH_YEAR = new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric", timeZone: "UTC" });

function dateBadge(date?: string | null) {
  if (!date) return null;
  const d = new Date(`${date.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return null;
  const monthsAway = (d.getTime() - Date.now()) / (30 * 86_400_000);
  return monthsAway > 10 ? WITH_YEAR.format(d) : SHORT.format(d);
}

/** A discovery carousel. Renders nothing when its source is empty or unavailable. */
export async function DiscoverRow({ title, subtitle, items, variant = "poster", dates, href, limit }: DiscoverRowProps) {
  const [list, index] = await Promise.all([items, getLibraryIndex()]);
  const shown = (variant === "ranked" ? list.slice(0, 10) : list).slice(0, limit ?? 24);
  if (shown.length < 3) return null;

  if (variant === "countdown") {
    return (
      <Row title={title} href={href} size="wide">
        {shown.map((item) => (
          <CountdownCard key={item.externalId} media={cardFromResult(item, index)} />
        ))}
      </Row>
    );
  }

  return (
    <Row title={title} subtitle={subtitle} href={href} size={variant === "ranked" ? "ranked" : "poster"}>
      {shown.map((item, i) => (
        <MediaCard
          key={`${item.type}-${item.externalId}`}
          media={cardFromResult(item, index)}
          sizes={variant === "ranked" ? ROW_SIZES.ranked : ROW_SIZES.poster}
          showRating={false}
          showInLibrary
          rank={variant === "ranked" ? i + 1 : undefined}
          badge={typeof item.metadata?.badge === "string" ? item.metadata.badge : dates ? dateBadge(item.releaseDate) : null}
        />
      ))}
    </Row>
  );
}
