// src/app/faq/page.tsx
'use client';

/**
 * Full-page FAQs (role-based, panel-like layout)
 *
 * - Brown top banner with "< Back" button.
 * - Left column: boxed page list (like the panel). No "Current page" badge.
 * - Right column: content (sections) for the filtered pages.
 * - 1:3 grid on md+; single column on mobile.
 * - Independent scrolling for left/right columns.
 * - Smooth anchor scrolling.
 *
 * Role filtering rules:
 * - Primary: page key prefix (family/ carer/ management) or title prefix.
 * - Sign Up: only the Sign Up for the current role.
 * - Sign in / Login: if title contains a role, filter by role; if generic, show for everyone.
 * - Create Organization: Management only.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { getSession } from 'next-auth/react';
import { faqData, type FAQBook, type FAQSection } from '@/components/help/faqData';
import { getViewerRoleFE } from '@/lib/mock/mockApi';

type Role = 'family' | 'carer' | 'management';

const palette = {
  deepBrown: '#3A0000',
  lightPeach: '#FFF7F2',
  boxBg: 'rgba(58,0,0,0.08)',
  boxBgActive: '#3A0000',
  boxBorder: 'rgba(58,0,0,0.18)',
  cardBg: 'rgba(58,0,0,0.06)',
  cardBorder: 'rgba(58,0,0,0.15)',
};

/* -------------------------- helpers: role + titles -------------------------- */

function cleanPageTitle(t: string) {
  return t
    .replace(/^Family\s*\/\s*POA\s*—\s*/i, '')
    .replace(/^Carer\s*—\s*/i, '')
    .replace(/^Management\s*—\s*/i, '')
    .trim();
}

// Role from key prefix, e.g. "family/..." -> "family"
function getRoleFromKey(k: keyof FAQBook): Role | null {
  const [role] = String(k).split('/', 1);
  if (role === 'family' || role === 'carer' || role === 'management') return role;
  return null;
}

// Role from title (prefix markers)
function inferRoleFromTitle(title: string): Role | null {
  const t = title.toLowerCase().trim();
  if (t.startsWith('family') || t.includes('poa')) return 'family';
  if (t.startsWith('carer')) return 'carer';
  if (t.startsWith('management')) return 'management';
  return null;
}

// Check if a title explicitly mentions a specific role
function matchRoleInTitle(title: string, role: Role): boolean {
  const t = title.toLowerCase();
  if (role === 'family') return /family|poa/.test(t);
  if (role === 'carer') return /\bcarer\b/.test(t);
  if (role === 'management') return /\bmanagement\b/.test(t);
  return false;
}

// Detect auth page type by title
type AuthType = 'signup' | 'signin' | 'login' | null;
function getAuthType(title: string): AuthType {
  const t = title.toLowerCase();
  if (/\bsign\s*up\b/.test(t)) return 'signup';
  if (/\bsign\s*in\b/.test(t)) return 'signin';
  if (/\blog\s*in\b/.test(t)) return 'login';
  return null;
}

// Management-only
function isCreateOrgForManagement(title: string) {
  return /create\s*organi[sz]ation/i.test(title);
}

/* ------------------------------- Q/A parsing ------------------------------- */

type QAPair = { q: string; a: string[] };

function parseQAPairs(body?: string | string[]): QAPair[] {
  if (!body) return [];
  const lines = (Array.isArray(body) ? body : [body]).map(s => String(s).trim()).filter(Boolean);
  const qa: QAPair[] = [];
  let current: QAPair | null = null;
  const qRe = /^q[:：]\s*/i;
  const aRe = /^a[:：]\s*/i;
  for (const line of lines) {
    if (qRe.test(line)) {
      const q = line.replace(qRe, '').trim();
      current = { q, a: [] };
      qa.push(current);
    } else if (aRe.test(line)) {
      if (!current) current = { q: '', a: [] };
      current.a.push(line.replace(aRe, '').trim());
    } else if (current) {
      current.a.push(line);
    }
  }
  return qa;
}

/* ------------------------------- UI: section ------------------------------- */

function FAQSectionBlock({ section }: { section: FAQSection }) {
  const qaPairs = parseQAPairs(section.body);
  const hasQA = qaPairs.length > 0;

  return (
    <section id={section.id} className="scroll-mt-28 mb-8">
      <h3 className="text-xl font-semibold mb-2" style={{ color: palette.deepBrown }}>
        {section.title}
      </h3>

      {hasQA ? (
        <div className="space-y-3">
          {qaPairs.map((pair, idx) => (
            <details
              key={idx}
              className="rounded-xl"
              style={{
                background: palette.cardBg,
                border: `1px solid ${palette.cardBorder}`,
                padding: '14px 16px',
              }}
            >
              <summary className="cursor-pointer select-none" style={{ color: palette.deepBrown }}>
                <span className="font-semibold">{pair.q || 'Question'}</span>
              </summary>
              <div className="mt-2 space-y-2" style={{ color: palette.deepBrown }}>
                {pair.a.length ? pair.a.map((p, i) => <p key={i}>{p}</p>) : <p>—</p>}
              </div>
            </details>
          ))}
        </div>
      ) : (
        (() => {
          const body = Array.isArray(section.body) ? section.body : section.body ? [section.body] : [];
          return body.length ? (
            <div className="space-y-3 leading-relaxed text-[1rem]" style={{ color: palette.deepBrown }}>
              {body.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          ) : null;
        })()
      )}
    </section>
  );
}

/* --------------------------------- Page ---------------------------------- */

export default function FAQPage() {
  // Resolve current viewer role (mock first, then next-auth session)
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);

  const isMock =
    process.env.NEXT_PUBLIC_ENABLE_MOCK === '1' ||
    process.env.NEXT_PUBLIC_ENABLE_MOCK === 'true';

  useEffect(() => {
    const load = async () => {
      try {
        if (isMock) {
          let r = (getViewerRoleFE() as Role | null) ?? null;
          if (!r) {
            const em = (localStorage.getItem('lastLoginEmail') || '').toLowerCase();
            if (em.includes('carer')) r = 'carer';
            else if (em.includes('management')) r = 'management';
            else if (em.includes('family')) r = 'family';
          }
          setRole(r ?? 'family'); // default to family if still unknown
          return;
        }
        const session = await getSession();
        const sRole = (session?.user as any)?.role as Role | undefined;
        setRole(sRole ?? 'family'); // default to family if missing
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isMock]);

  // Build the full list (metadata for filtering + anchors)
  const pagesAll = useMemo(() => {
    const keys = Object.keys(faqData) as (keyof FAQBook)[];
    return keys.map((key) => {
      const page = faqData[key];
      const pageId = `page-${String(key).replace(/[^a-z0-9]+/gi, '-').replace(/(^-|-$)/g, '').toLowerCase()}`;
      const title = page?.title ?? String(key);
      return {
        key,
        pageId,
        title,
        cleanTitle: cleanPageTitle(title),
        sections: page?.sections ?? [],
        keyRole: getRoleFromKey(key),
        titleRole: inferRoleFromTitle(title),
      };
    });
  }, []);

  // Role-based filter (with auth/create-org special rules)
  const pages = useMemo(() => {
    if (!role) return [];
    return pagesAll.filter((p) => {
      // 1) explicit role match from key or title
      if (p.keyRole === role || p.titleRole === role) return true;

      // 2) Auth pages: Sign Up / Sign in / Login
      const auth = getAuthType(p.title);
      if (auth === 'signup') {
        // show only the "Sign Up" for the current role
        return matchRoleInTitle(p.title, role);
      }
      if (auth === 'signin' || auth === 'login') {
        // if role is mentioned in title, filter by role; if generic, keep for all roles
        const hasRoleMarker =
          matchRoleInTitle(p.title, 'family') ||
          matchRoleInTitle(p.title, 'carer') ||
          matchRoleInTitle(p.title, 'management');
        return hasRoleMarker ? matchRoleInTitle(p.title, role) : true;
      }

      // 3) Create Organization -> management only
      if (isCreateOrgForManagement(p.title)) return role === 'management';

      // 4) otherwise, hide
      return false;
    });
  }, [pagesAll, role]);

  // Selected page highlight in the left TOC
  const [selectedPageId, setSelectedPageId] = useState<string>('');
  useEffect(() => {
    if (!selectedPageId && pages.length) setSelectedPageId(pages[0].pageId);
  }, [pages, selectedPageId]);

  const handleBack = () => {
    if (typeof window !== 'undefined') window.history.back();
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') window.print();
  };

  const jumpTo = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    setSelectedPageId(id);
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (loading) {
    return (
      <main
        className="h-screen w-full flex items-center justify-center"
        style={{ background: palette.lightPeach }}
      >
        <div className="text-xl font-semibold" style={{ color: palette.deepBrown }}>
          Loading FAQs…
        </div>
      </main>
    );
  }

  return (
    <main
      className="h-screen w-full flex flex-col overflow-hidden"
      style={{ background: palette.lightPeach, color: palette.deepBrown }}
    >
      {/* Brown banner */}
      <header
        className="flex items-center justify-between px-5 sm:px-6 py-3"
        style={{ background: palette.deepBrown, color: '#fff' }}
      >
        {/* title + print */}
        <div className="flex items-center gap-8">
            <h1 className="text-2xl md:text-3xl font-semibold">
            {role === 'family' ? 'Family/POA FAQs' : role === 'carer' ? 'Carer FAQs' : 'Management FAQs'}
            </h1>

            <button
            onClick={handlePrint}
            className="inline-flex items-center px-3 sm:px-4 py-1.5 rounded-2xl border border-white/40 bg-white font-semibold text-sm sm:text-base hover:bg-pink-50 transition-colors"
            title="Print"
            aria-label="Print"
            style={{ color: palette.deepBrown }}
            >
            Print
            </button>
        </div>

        <button
          onClick={handleBack}
          className="rounded-lg px-4 py-2 text-lg font-semibold shadow-sm hover:opacity-90 transition"
          style={{ background: palette.deepBrown, color: '#fff' }}
          aria-label="Back"
          title="Back"
        >
          &lt; Back
        </button>
      </header>

      {/* Body: 1:3 columns with independent scroll */}
      <div className="flex-1 px-5 sm:px-6 py-4 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_3fr] gap-6 h-full">
          {/* LEFT: boxed page list (panel-like) */}
          <aside
            className="hidden md:block overflow-y-auto rounded-xl p-4"
            style={{
              background: 'rgba(58,0,0,0.10)',
              border: `1px solid ${palette.boxBorder}`,
              maxHeight: '100%',
            }}
          >
            <ul className="flex flex-col gap-5">
              {pages.map(({ pageId, cleanTitle }) => {
                const isActive = selectedPageId === pageId;
                return (
                  <li key={pageId}>
                    <button
                      type="button"
                      onClick={() => jumpTo(pageId)}
                      className="block w-full text-left no-underline transition-[background,color] duration-150"
                      style={{
                        color: isActive ? '#fff' : palette.deepBrown,
                        background: isActive ? palette.boxBgActive : palette.boxBg,
                        borderRadius: 16,
                        padding: '16px 18px',
                        lineHeight: 1.35,
                        fontSize: '1.12rem',
                        fontWeight: 500,
                      }}
                      id={`toc-${pageId}`}
                    >
                      {cleanTitle}
                    </button>
                  </li>
                );
              })}
            </ul>
          </aside>

          {/* RIGHT: content (scrolls independently) */}
          <section className="overflow-y-auto pr-1">
            {/* Smooth anchor scrolling */}
            <style jsx global>{`
              html { scroll-behavior: smooth; }
            `}</style>

            {pages.map(({ key, pageId, cleanTitle, sections }) => (
              <article key={String(key)} className="mb-12">
                <h2 id={pageId} className="text-2xl font-semibold mb-4 scroll-mt-28">
                  {cleanTitle}
                </h2>
                {sections.map((s: FAQSection) => (
                  <FAQSectionBlock key={s.id} section={s} />
                ))}
              </article>
            ))}
          </section>
        </div>
      </div>
    </main>
  );
}
