import type { Metadata } from "next";
import { getPerson } from "@/lib/providers";
import { PersonPage } from "@/components/person/person-page";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  try {
    return { title: (await getPerson((await params).id)).name };
  } catch {
    return { title: "Person" };
  }
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  return <PersonPage id={(await params).id} />;
}
