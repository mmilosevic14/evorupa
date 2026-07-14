import { describe, expect, it } from 'vitest'

const {
  DEFAULT_BUCKET,
  buildPhotoAudit,
  extractStorageObjectName,
  getReferencedObjectName,
  parseArgs,
} = require('../scripts/audit-report-photos.js')

describe('report photo audit script helpers', () => {
  it('extracts the storage object name from a public report photo URL', () => {
    expect(
      extractStorageObjectName(
        'https://wqnrywhafxutgginzbvk.supabase.co/storage/v1/object/public/report-photos/report-photos/user-1/file.webp',
      ),
    ).toBe('report-photos/user-1/file.webp')
  })

  it('returns null for non-supabase or malformed URLs', () => {
    expect(extractStorageObjectName('not-a-url')).toBeNull()
    expect(extractStorageObjectName('https://example.com/file.webp')).toBeNull()
  })

  it('prefers stored photo_path over parsing the public URL', () => {
    expect(
      getReferencedObjectName({
        photo_path: 'user-1/path.webp',
        photo_url: 'https://example.com/ignored.webp',
      }),
    ).toBe('user-1/path.webp')
  })

  it('identifies missing and orphaned storage objects', () => {
    const audit = buildPhotoAudit({
      bucketName: DEFAULT_BUCKET,
      reports: [
        {
          id: 'report-1',
          photo_url:
            'https://wqnrywhafxutgginzbvk.supabase.co/storage/v1/object/public/report-photos/report-photos/user-1/active.webp',
        },
        {
          id: 'report-2',
          photo_url:
            'https://wqnrywhafxutgginzbvk.supabase.co/storage/v1/object/public/report-photos/report-photos/user-1/missing.webp',
        },
        {
          id: 'report-3',
          photo_url: 'https://example.com/image.webp',
        },
        {
          id: 'report-4',
          photo_url: null,
          photo_path: 'user-1/from-path.webp',
        },
      ],
      objects: [
        {
          id: 'object-1',
          name: 'report-photos/user-1/active.webp',
          owner: 'user-1',
          created_at: '2026-07-14T00:00:00.000Z',
          updated_at: '2026-07-14T00:00:00.000Z',
          last_accessed_at: '2026-07-14T00:00:00.000Z',
        },
        {
          id: 'object-2',
          name: 'report-photos/user-1/orphaned.webp',
          owner: 'user-1',
          created_at: '2026-07-14T00:00:00.000Z',
          updated_at: '2026-07-14T00:00:00.000Z',
          last_accessed_at: '2026-07-14T00:00:00.000Z',
        },
        {
          id: 'object-3',
          name: 'user-1/from-path.webp',
          owner: 'user-1',
          created_at: '2026-07-14T00:00:00.000Z',
          updated_at: '2026-07-14T00:00:00.000Z',
          last_accessed_at: '2026-07-14T00:00:00.000Z',
        },
      ],
    })

    expect(audit.malformedReports).toEqual([
      {
        reportId: 'report-3',
        photoUrl: 'https://example.com/image.webp',
        photoPath: null,
      },
    ])
    expect(audit.missingObjects).toEqual([
      {
        objectName: 'report-photos/user-1/missing.webp',
        reports: [
          {
            reportId: 'report-2',
            photoUrl:
              'https://wqnrywhafxutgginzbvk.supabase.co/storage/v1/object/public/report-photos/report-photos/user-1/missing.webp',
            photoPath: null,
          },
        ],
      },
    ])
    expect(audit.orphanedObjects).toEqual([
      {
        id: 'object-2',
        name: 'report-photos/user-1/orphaned.webp',
        owner: 'user-1',
        created_at: '2026-07-14T00:00:00.000Z',
        updated_at: '2026-07-14T00:00:00.000Z',
        last_accessed_at: '2026-07-14T00:00:00.000Z',
      },
    ])
  })

  it('parses delete and json command flags', () => {
    expect(parseArgs(['--delete-orphans', '--json'])).toEqual({
      deleteOrphans: true,
      json: true,
      bucketName: DEFAULT_BUCKET,
    })
  })
})