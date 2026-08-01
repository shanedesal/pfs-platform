import Header from "@/components/header";
import Hero from "@/components/hero";
import CategoryNav from "@/components/category-nav";
import FeaturedProducts from "@/components/featured-products";
import SearchResults from "@/components/search-results";
import Footer from "@/components/footer";

type HomePageProps = {
  searchParams: Promise<{ q?: string | string[]; category?: string | string[] }>;
};

function firstParam(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const query = firstParam(params.q);
  const categoryId = firstParam(params.category);
  const searching = query.length > 0;

  return (
    <>
      <Header />
      <main>
        {searching ? (
          <SearchResults query={query} />
        ) : (
          <>
            <Hero />
            <CategoryNav activeCategoryId={categoryId || null} />
            <FeaturedProducts categoryId={categoryId || null} />
          </>
        )}
      </main>
      <Footer />
    </>
  );
}
