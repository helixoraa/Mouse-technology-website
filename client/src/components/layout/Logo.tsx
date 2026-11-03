import { Link } from 'react-router-dom';
import logoM from '@/assets/svg/logo-m.svg';
import { mediaUrl } from '@/lib/api';

export function Logo({ siteName = 'MAOUAJ Technology', logoUrl }: { siteName?: string; logoUrl?: string | null }) {
  const [first, ...rest] = siteName.split(' ');
  return (
    <Link to="/" className="flex items-center gap-2.5" aria-label={`${siteName} home`}>
      <span className="flex items-start rounded-chip bg-logo p-1.5">
        <img src={logoUrl ? mediaUrl(logoUrl) : logoM} alt="" className="size-4 object-contain" />
      </span>
      <span className="text-[17px] font-bold text-text-onDark">{first}</span>
      <span className="text-[17px] font-normal text-text-muted">{rest.join(' ')}</span>
    </Link>
  );
}
