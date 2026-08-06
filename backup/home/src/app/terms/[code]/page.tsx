import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import TermView from "@/components/site/TermView";

export default async function TermPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return (
    <>
      <Header />
      <section className="mx-auto max-w-4xl px-5 py-14 sm:py-16">
        <TermView code={code.toUpperCase()} variant="page" />
      </section>
      <Footer />
    </>
  );
}
