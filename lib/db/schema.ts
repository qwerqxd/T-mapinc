import { sql } from "drizzle-orm"
import {
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  point,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core"

export const UserRole = pgEnum("user_role", ["admin", "standard"])
export const usersTable = pgTable("users", {
  id: uuid().primaryKey().defaultRandom(),
  name: varchar({ length: 100 }).notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
  password_hash: varchar({ length: 255 }).notNull(),
  user_role: UserRole().notNull().default("standard"),
  created_at: timestamp({ mode: "date", withTimezone: true }).notNull().defaultNow(),
})

export const tagsTable = pgTable(
  "tags",
  {
    id: uuid().primaryKey().defaultRandom(),
    author_id: uuid()
      .references(() => usersTable.id, { onDelete: "cascade" })
      .notNull(),
    title: varchar({ length: 50 }).notNull(),
    description: varchar({ length: 200 }),
    location: point({ mode: "xy" }).notNull(),
    created_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("tag_author_idx").on(t.author_id)]
)

export const reviewsTable = pgTable(
  "reviews",
  {
    id: uuid().primaryKey().defaultRandom(),
    author_id: uuid()
      .references(() => usersTable.id, { onDelete: "cascade" })
      .notNull(),
    tag_id: uuid()
      .references(() => tagsTable.id, { onDelete: "cascade" })
      .notNull(),
    rating: integer().notNull(),
    comment: varchar({ length: 200 }),
    created_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check("rating_check", sql`${t.rating} BETWEEN 1 AND 5`),
    unique("one_review_user_tag").on(t.author_id, t.tag_id),
    index("review_author_idx").on(t.author_id),
    index("review_tag_idx").on(t.tag_id),
  ]
)
