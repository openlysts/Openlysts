import { ShieldCheck, HelpCircle, XCircle } from 'lucide-react';

export default function LicenseBadge({ repo }) {
  if (!repo) return null;
  const rawKey = String(repo.license_key || repo.license?.spdx_id || repo.license_spdx || '').trim();
  const name = repo.license_name || repo.license?.name || repo.license || '';
  const status = repo.license_status;

  const isKnownNonOss = status === 'non_oss' || rawKey.toLowerCase() === 'non_oss' || rawKey.toLowerCase() === 'proprietary';
  const hasValidOssKey = rawKey && rawKey.toLowerCase() !== 'unknown' && rawKey.toLowerCase() !== 'other' && rawKey.toLowerCase() !== 'none' && !isKnownNonOss;

  if (status === 'verified_oss' || hasValidOssKey) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-oss-soft text-oss border border-oss/20">
        <ShieldCheck className="w-3 h-3" />
        {rawKey ? rawKey.toUpperCase() : (name || 'OSS')}
      </span>
    );
  }
  if (isKnownNonOss) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-nonoss-soft text-nonoss border border-nonoss/20">
        <XCircle className="w-3 h-3" />
        {name || 'Non-OSS'}
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