import { notFound } from "next/navigation";
import NoticeForm from "@/components/master/NoticeForm";
import { isNoticeSeg } from "@/lib/noticeMeta";

export default async function NoticeNewPage({ params }: { params: Promise<{ target: string }> }) {
  const { target } = await params;
  if (!isNoticeSeg(target)) notFound();
  return <NoticeForm seg={target} mode="new" />;
}
