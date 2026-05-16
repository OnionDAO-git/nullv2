import type { PageServerLoad } from './$types';
import { and, desc, eq, isNull, sql } from 'drizzle-orm';
import { schema } from '@nullv2/db';
import { db } from '$lib/server/db';

export interface LetterRow {
  id: string;
  kind: string;
  faction: string | null;
  fromName: string;
  fromMonogram: string;
  fromEmotion: string;
  subject: string;
  preview: string;
  unread: boolean;
  createdAt: string;
  body: string | null;
}

export const load: PageServerLoad = async ({ url, locals }) => {
  const visitor = locals.visitor;
  if (!visitor)
    return {
      letters: [] as LetterRow[],
      total: 0,
      unread: 0,
      opened: null as LetterRow | null,
    };
  const me = visitor.human;

  const wantedId = url.searchParams.get('id');

  const rows = await db
    .select()
    .from(schema.letters)
    .where(
      and(eq(schema.letters.humanId, me.id), isNull(schema.letters.archivedAt)),
    )
    .orderBy(desc(schema.letters.createdAt))
    .limit(80);

  const [totalRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.letters)
    .where(eq(schema.letters.humanId, me.id));
  const [unreadRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.letters)
    .where(
      and(
        eq(schema.letters.humanId, me.id),
        isNull(schema.letters.readAt),
        isNull(schema.letters.archivedAt),
      ),
    );

  // Pick the opened letter: prefer ?id=, fall back to most-recent unread.
  let opened: LetterRow | null = null;
  if (wantedId) {
    const found = rows.find((r) => r.id === wantedId);
    if (found) {
      if (!found.readAt) {
        await db
          .update(schema.letters)
          .set({ readAt: new Date() })
          .where(eq(schema.letters.id, found.id));
        found.readAt = new Date();
      }
      opened = {
        id: found.id,
        kind: found.kind,
        faction: found.faction,
        fromName: found.fromName,
        fromMonogram: found.fromMonogram,
        fromEmotion: found.fromEmotion,
        subject: found.subject,
        preview: found.preview,
        unread: false,
        createdAt: found.createdAt.toISOString(),
        body: found.body,
      };
    }
  }
  if (!opened) {
    const firstUnread = rows.find((r) => !r.readAt);
    if (firstUnread) {
      // We do NOT auto-mark-as-read here so the badge survives the page load —
      // the visitor explicitly opens by clicking. Show preview only.
      opened = {
        id: firstUnread.id,
        kind: firstUnread.kind,
        faction: firstUnread.faction,
        fromName: firstUnread.fromName,
        fromMonogram: firstUnread.fromMonogram,
        fromEmotion: firstUnread.fromEmotion,
        subject: firstUnread.subject,
        preview: firstUnread.preview,
        unread: true,
        createdAt: firstUnread.createdAt.toISOString(),
        body: firstUnread.body,
      };
    }
  }

  const letters: LetterRow[] = rows.map((r) => ({
    id: r.id,
    kind: r.kind,
    faction: r.faction,
    fromName: r.fromName,
    fromMonogram: r.fromMonogram,
    fromEmotion: r.fromEmotion,
    subject: r.subject,
    preview: r.preview,
    unread: !r.readAt,
    createdAt: r.createdAt.toISOString(),
    body: null,
  }));

  return {
    letters,
    total: totalRow?.count ?? 0,
    unread: unreadRow?.count ?? 0,
    opened,
  };
};
