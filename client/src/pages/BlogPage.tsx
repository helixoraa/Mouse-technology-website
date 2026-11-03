import { getSection, usePage } from '@/lib/api';
import { Seo } from '@/components/ui/Seo';
import { CtaCard, type CtaContent } from '@/components/ui/CtaCard';
import { BlogHero, type BlogHeroContent } from '@/components/sections/Blog/BlogHero';
import { BlogArticles, type BlogArticlesContent } from '@/components/sections/Blog/BlogArticles';

export default function BlogPage() {
  const { data } = usePage('blog');
  const cta = getSection<CtaContent>(data, 'cta');
  return (
    <>
      <Seo title={data?.seo.title} description={data?.seo.description} ogImage={data?.seo.ogImage} />
      <BlogHero content={getSection<BlogHeroContent>(data, 'hero')} />
      <BlogArticles content={getSection<BlogArticlesContent>(data, 'articles')} />
      {cta && <CtaCard content={cta} />}
    </>
  );
}
