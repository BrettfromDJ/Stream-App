import type { Metadata } from "next";
import { getAuthor } from "@/lib/providers";
import { AuthorPage } from "@/components/author/author-page";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  try {
    return { title: (await getAuthor(decodeURIComponent((await params).id))).name };
  } catch {
    return { title: "Author" };
  }
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  return <AuthorPage id={decodeURIComponent((await params).id)} />;
}
