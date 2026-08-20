import { ShieldCheck, HelpCircle, XCircle } from 'lucide-react';

export default function LicenseBadge({ repo }) {
  const status = repo.license_status || 'unknown';
  const name = repo.license_name || (status === 'verified_oss' ? 'OSS' : 'Unknown');

  if (status === 'verified_oss') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-oss-soft text-oss border border-oss/20">
        <ShieldCheck className="w-3 h-3" />
        {repo.license_key?.toUpperCase() || 'OSS'}
      </span>
    );
  }
  if (status === 'non_oss') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-nonoss-soft text-nonoss border border-nonoss/20">
        <XCircle className="w-3 h-3" />
        {name}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-unknown-soft text-unknown border border-unknown/20">
      <HelpCircle className="w-3 h-3" />
      Unknown
    </span>
  );
}