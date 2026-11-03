import { Badge } from '@/components/admin/ui';
import { Thumb, ResourcePage, type ResourceConfig } from '@/components/admin/ResourcePage';
import { useAuth } from '@/lib/auth';
import { fmtDate } from '@/lib/admin-api';

const trunc = (s: unknown, n = 70) => {
  const t = String(s ?? '');
  return t.length > n ? `${t.slice(0, n)}…` : t;
};

const servicesCfg: ResourceConfig = {
  path: 'services',
  title: 'Services & projects',
  singular: 'Service',
  description: 'Products, planned initiatives and existing businesses shown on the Products, Projects and Home pages.',
  reorder: true,
  hasVisible: true,
  defaults: { category: 'product', status: 'In development', visible: true, ctaLabel: 'Learn more', ctaHref: '' },
  columns: [
    { key: 'image', label: 'Image', render: (r) => <Thumb src={r.image} alt={String(r.title)} /> },
    { key: 'title', label: 'Title', render: (r) => <span className="font-bold text-ink">{String(r.title)}</span> },
    { key: 'category', label: 'Category', render: (r) => <Badge tone="neutral">{String(r.category)}</Badge> },
    { key: 'status', label: 'Status', className: 'hidden md:table-cell' },
  ],
  fields: [
    { name: 'title', label: 'Title', required: true },
    { name: 'slug', label: 'Slug', required: true, hint: 'URL-friendly identifier, e.g. cashless-bus-fare-platform' },
    {
      name: 'category',
      label: 'Category',
      type: 'select',
      required: true,
      options: [
        { value: 'product', label: 'Product (main development project)' },
        { value: 'planned', label: 'Planned initiative' },
        { value: 'business', label: 'Existing business' },
      ],
    },
    { name: 'status', label: 'Status label', required: true, hint: 'e.g. In development, Planned, Existing business' },
    { name: 'summary', label: 'Summary', type: 'textarea', required: true },
    { name: 'description', label: 'Description (optional)', type: 'textarea' },
    { name: 'image', label: 'Image', type: 'image' },
    { name: 'gradient', label: 'Fallback gradient (CSS, optional)', full: true },
    { name: 'ctaLabel', label: 'Link label' },
    { name: 'ctaHref', label: 'Link URL' },
    { name: 'extra', label: 'Extra data (JSON, optional)', type: 'json' },
    { name: 'visible', label: 'Visible on the website', type: 'checkbox' },
  ],
};

const testimonialsCfg: ResourceConfig = {
  path: 'testimonials',
  title: 'Testimonials',
  singular: 'Testimonial',
  description:
    'Customer and partner quotes. (The current Figma design has no public testimonial section; entries are served by GET /api/testimonials.)',
  reorder: true,
  hasVisible: true,
  defaults: { visible: true },
  columns: [
    { key: 'avatar', label: 'Photo', render: (r) => <Thumb src={r.avatar} alt={String(r.name)} /> },
    { key: 'name', label: 'Name', render: (r) => <span className="font-bold text-ink">{String(r.name)}</span> },
    { key: 'quote', label: 'Quote', render: (r) => trunc(r.quote), className: 'hidden md:table-cell' },
  ],
  fields: [
    { name: 'name', label: 'Name', required: true },
    { name: 'role', label: 'Role', required: true },
    { name: 'company', label: 'Company' },
    { name: 'quote', label: 'Quote', type: 'textarea', required: true },
    { name: 'avatar', label: 'Photo', type: 'image' },
    { name: 'visible', label: 'Visible on the website', type: 'checkbox' },
  ],
};

const teamCfg: ResourceConfig = {
  path: 'team',
  title: 'Team',
  singular: 'Team member',
  description: 'People shown on the Our Team page. Drag to change the order.',
  reorder: true,
  hasVisible: true,
  defaults: { visible: true },
  columns: [
    { key: 'photo', label: 'Photo', render: (r) => <Thumb src={r.photo} alt={String(r.name)} /> },
    { key: 'name', label: 'Name', render: (r) => <span className="font-bold text-ink">{String(r.name)}</span> },
    { key: 'role', label: 'Role' },
    { key: 'bio', label: 'Biography', render: (r) => trunc(r.bio), className: 'hidden lg:table-cell' },
  ],
  fields: [
    { name: 'name', label: 'Full name', required: true },
    { name: 'role', label: 'Role / title', required: true },
    { name: 'bio', label: 'Short biography', type: 'textarea', required: true },
    { name: 'photo', label: 'Photo', type: 'image' },
    { name: 'visible', label: 'Visible on the website', type: 'checkbox' },
  ],
};

const faqsCfg: ResourceConfig = {
  path: 'faqs',
  title: 'FAQs',
  singular: 'FAQ',
  description: 'Frequently asked questions shown on the homepage.',
  reorder: true,
  hasVisible: true,
  defaults: { visible: true },
  columns: [
    { key: 'question', label: 'Question', render: (r) => <span className="font-bold text-ink">{String(r.question)}</span> },
    { key: 'answer', label: 'Answer', render: (r) => trunc(r.answer, 80), className: 'hidden md:table-cell' },
  ],
  fields: [
    { name: 'question', label: 'Question', required: true, full: true },
    { name: 'answer', label: 'Answer', type: 'textarea', required: true },
    { name: 'visible', label: 'Visible on the website', type: 'checkbox' },
  ],
};

const postsCfg: ResourceConfig = {
  path: 'posts',
  title: 'Blog posts',
  singular: 'Post',
  description: 'Updates shown on the Blog & Updates page and the homepage.',
  hasVisible: true,
  defaults: { visible: true, category: 'Product explainer', author: 'MAOUAJ Team' },
  columns: [
    { key: 'image', label: 'Image', render: (r) => <Thumb src={r.image} alt={String(r.title)} /> },
    { key: 'title', label: 'Title', render: (r) => <span className="font-bold text-ink">{String(r.title)}</span> },
    { key: 'category', label: 'Category', className: 'hidden md:table-cell' },
    {
      key: 'publishedAt',
      label: 'Published',
      render: (r) => fmtDate(String(r.publishedAt ?? '')).split(',')[0],
      className: 'hidden lg:table-cell',
    },
  ],
  fields: [
    { name: 'title', label: 'Title', required: true, full: true },
    { name: 'slug', label: 'Slug', required: true },
    { name: 'category', label: 'Category label', required: true },
    { name: 'author', label: 'Author', required: true },
    { name: 'publishedAt', label: 'Publish date', type: 'date' },
    { name: 'excerpt', label: 'Excerpt', type: 'textarea', required: true },
    { name: 'body', label: 'Body (optional)', type: 'textarea', rows: 8 },
    { name: 'image', label: 'Image', type: 'image' },
    { name: 'visible', label: 'Visible on the website', type: 'checkbox' },
  ],
};

const usersCfg: ResourceConfig = {
  path: 'users',
  title: 'Users',
  singular: 'User',
  description: 'Admins can manage everything including users; editors can manage content and leads.',
  defaults: { role: 'EDITOR' },
  canDelete: (r, me) => r.id !== me,
  columns: [
    { key: 'name', label: 'Name', render: (r) => <span className="font-bold text-ink">{String(r.name)}</span> },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role', render: (r) => <Badge tone={r.role === 'ADMIN' ? 'brand' : 'neutral'}>{String(r.role)}</Badge> },
  ],
  fields: [
    { name: 'name', label: 'Name', required: true },
    { name: 'email', label: 'Email', type: 'email', required: true },
    {
      name: 'role',
      label: 'Role',
      type: 'select',
      required: true,
      options: [
        { value: 'ADMIN', label: 'Admin' },
        { value: 'EDITOR', label: 'Editor' },
      ],
    },
    { name: 'password', label: 'Password', type: 'password', hint: 'Min. 8 characters. Leave empty on edit to keep the current password.' },
  ],
};

export const ServicesPage = () => <ResourcePage cfg={servicesCfg} />;
export const TestimonialsPage = () => <ResourcePage cfg={testimonialsCfg} />;
export const TeamAdminPage = () => <ResourcePage cfg={teamCfg} />;
export const FaqsAdminPage = () => <ResourcePage cfg={faqsCfg} />;
export const PostsAdminPage = () => <ResourcePage cfg={postsCfg} />;
export function UsersPage() {
  const { user } = useAuth();
  return <ResourcePage cfg={usersCfg} currentUserId={user?.id} />;
}
