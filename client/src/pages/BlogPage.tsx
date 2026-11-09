import { getSection, usePage, usePosts } from '@/lib/api';
import { Seo } from '@/components/ui/Seo';
import { CtaCard, type CtaContent } from '@/components/ui/CtaCard';
import { BlogHero, type BlogHeroContent } from '@/components/sections/Blog/BlogHero';
import { BlogArticles, type BlogArticlesContent } from '@/components/sections/Blog/BlogArticles';

export default function BlogPage() {
  const { data } = usePage('blog');
  // Wait for the page and its posts (a separate query) so neither the footer nor the article grid moves once they arrive.
  const { isPending: postsPending } = usePosts();
  if (!data || postsPending) return <div className="min-h-screen bg-hero" />;
  const cta = getSection<CtaContent>(data, 'cta');
  return (
    <>
      <Seo title={data.seo.title} description={data.seo.description} ogImage={data.seo.ogImage} />
      <BlogHero content={getSection<BlogHeroContent>(data, 'hero')} />
      <BlogArticles content={getSection<BlogArticlesContent>(data, 'articles')} />
      {cta && <CtaCard content={cta} />}
    </>
  );
}
