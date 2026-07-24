import { notFound } from "next/navigation";
import NoticeList from "@/components/master/NoticeList";
import { isNoticeSeg } from "@/lib/noticeMeta";

export default async function NoticeListPage({ params }: { params: Promise<{ target: string }> }) {
  const { target } = await params;
  if (!isNoticeSeg(target)) notFound();
  return <NoticeList seg={target} />;
}
