'use client';

import Head from 'next/head';
import { usePathname } from 'next/navigation';

export default function CanonicalURL() {
  const pathname = usePathname();
  const canonicalUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://docs-generator-phi.vercel.app'}${pathname}`;
  
  return (
    <Head>
      <link rel="canonical" href={canonicalUrl} />
    </Head>
  );
}