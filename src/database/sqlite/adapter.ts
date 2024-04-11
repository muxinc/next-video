import { eq, and } from "drizzle-orm"
import {
  integer,
  sqliteTable as defaultSqliteTableFn,
  text,
  BaseSQLiteDatabase,
  SQLiteTableFn,
} from "drizzle-orm/sqlite-core"
import { Asset } from '../../assets'

export function createTables(sqliteTable: SQLiteTableFn) {
  const sources = sqliteTable("sources", {
    id: integer('id').primaryKey({autoIncrement: true}).notNull(),
    src: text('src').notNull(),
    type: text('type'),
    videoId: integer('video_id').references(() => videos.id).notNull(),
  })

  const videos = sqliteTable("videos", {
    id: integer('id').primaryKey({autoIncrement: true}).notNull(),
    status: text('status', {enum: [
      'sourced',
      'pending',
      'uploading',
      'processing',
      'ready',
      'error',
    ]}).notNull(),
    originalFilePath: text('original_file_path').notNull(),
    provider: text('provider', {enum: [ 'mux',  'vercel-blob', 'backblaze', 'amazon-s3']}).notNull(),
    providerMetadata: text('provider_metadata', {mode: 'json'}).notNull(),
    poster: text('poster'),
    blurDataURL: text('blur_data_url'),
    size: integer('size'),
    error: text('error'),
    createdAt: integer('created_at').default(Date.now()).notNull(),
    updatedAt: integer('updated_at').default(Date.now()).notNull(),
  })

  return { videos, sources }
}

export type DefaultSchema = ReturnType<typeof createTables>

export function SQLiteDrizzleAdapter(
  client: InstanceType<typeof BaseSQLiteDatabase>,
  tableFn = defaultSqliteTableFn
) {
  const { videos, sources } = createTables(tableFn)

  return {
    async createVideo(data : Asset) {
      await client.transaction(async (tx) => {
        const video = await tx.insert(videos)
          .values(data as any)
          .returning()
          .get()

        const sourcesData = data.sources ?? []

        for (let source of sourcesData) {
          await tx
            .insert(sources)
            .values({src: source.src, type: source.type, videoId: video.id})
            .get()
        }
      });
    },
    async updateVideo(id: number, data: Asset) {
      await client.transaction(async (tx) => {
        const video = await tx
          .update(videos)
          .set(data as any)
          .where(eq(videos.id, id))
          .returning()
          .get()

        const sourcesData = data.sources ?? []

        for (let source of sourcesData) {
          await tx
            .insert(sources)
            .values({src: source.src, type: source.type, videoId: video.id})
            .onConflictDoUpdate({
              target: [sources.src, sources.type],
              set: {src: source.src, type: source.type, videoId: video.id}
            })
            .get()
        }
      });
    },
    async getVideo(id: number) {
      return await client
        .select()
        .from(videos)
        .where(eq(videos.id, id))
        .get()
    },
  }
}