import { notFound } from "next/navigation";
import NoticeForm from "@/components/master/NoticeForm";
import { isNoticeSeg } from "@/lib/noticeMeta";

export default async function NoticeEditPage({ params }: { params: Promise<{ target: string; id: string }> }) {
  const { target, id } = await params;
  if (!isNoticeSeg(target)) notFound();
  return <NoticeForm seg={target} mode="edit" id={Number(id)} />;
}
