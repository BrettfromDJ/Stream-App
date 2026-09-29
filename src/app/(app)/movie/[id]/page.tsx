import { DetailPage } from "@/components/detail/detail-page";
import { detailMetadata } from "@/components/detail/metadata";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  return detailMetadata("movie", decodeURIComponent((await params).id));
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  return <DetailPage type="movie" id={decodeURIComponent((await params).id)} />;
}
