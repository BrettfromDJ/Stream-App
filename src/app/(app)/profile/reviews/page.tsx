import type { Metadata } from "next";
import Link from "next/link";
import { getLibrary } from "@/lib/library/queries";
import { formatShortDate, yearFrom } from "@/lib/media/format";
import { TYPE_LABEL, mediaHref } from "@/lib/media/labels";
import { BackButton } from "@/components/detail/back-button";
import { Artwork } from "@/components/media/artwork";
import { StarRating } from "@/components/library/star-rating";
import { buttonClasses } from "@/components/ui/button";

export const metadata: Metadata = { title: "Reviews" };

export default async function ReviewsPage() {
  const { items } = await getLibrary();
  const reviews = items
    .filter((i) => i.review)
    .sort((a, b) => new Date(b.reviewedAt ?? b.updatedAt).getTime() - new Date(a.reviewedAt ?? a.updatedAt).getTime());

  return (
    <div className="animate-fade-in">
      <div className="gutter pt-[calc(env(safe-area-inset-top)+0.75rem)] lg:pt-8">
        <BackButton />
        <h1 className="mt-5 text-[32px] leading-[1.1] font-bold tracking-[-0.025em] md:text-[38px]">Reviews</h1>
        <p className="mt-1 text-[14px] text-fg-3">Your entertainment journal.</p>
      </div>

      {reviews.length === 0 ? (
        <div className="gutter py-16">
          <p className="text-[20px] font-bold tracking-[-0.02em]">No reviews yet.</p>
          <p className="mt-1.5 text-[15px] text-fg-2">Finish something and write down what you thought.</p>
          <Link href="/library?status=completed" className={buttonClasses("primary", "md", "mt-6")}>
            Your Finished Titles
          </Link>
        </div>
      ) : (
        <ol className="gutter mt-8 flex max-w-3xl flex-col">
          {reviews.map((item) => {
            const year = yearFrom(item.releaseDate);
            return (
              <li key={item.id} className="border-b border-white/[0.06] py-6 first:pt-0 last:border-0">
                <Link href={mediaHref(item.mediaType, item.externalId)} className="group flex gap-4">
                  <div className="relative aspect-[2/3] w-[72px] shrink-0 overflow-hidden rounded-[10px] ring-1 ring-white/[0.06] md:w-[88px]">
                    <Artwork src={item.artworkUrl} title={item.title} type={item.mediaType} sizes="88px" compactFallback />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] text-fg-3">
                      {formatShortDate(item.reviewedAt ?? item.updatedAt)} · {TYPE_LABEL[item.mediaType]}
                    </p>
                    <p className="mt-0.5 text-[17px] leading-tight font-semibold tracking-[-0.015em] group-hover:underline group-hover:decoration-white/30 group-hover:underline-offset-4">
                      {item.title}
                      {year ? <span className="font-normal text-fg-3"> {year}</span> : null}
                    </p>
                    {item.rating ? <StarRating value={item.rating} size={14} className="mt-1.5" /> : null}
                    <p className="mt-2.5 text-[15px] leading-relaxed whitespace-pre-line text-fg/85">{item.review}</p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
