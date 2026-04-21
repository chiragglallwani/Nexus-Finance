import type { APIResponse } from '@/models/types'
import { api, getCookieValue } from '@/lib/axios'
import { Routes } from '@/utils/routes'

export interface UploadTransactionAccepted {
  jobId: string
  status: string
  fileName: string
  fileSize: number
}

export interface UploadJobStatusData {
  jobId: string
  status: string
  totalRows: number | null
  processedRows: number
  failedRows: number
  progressPct: number
  fileName: string | null
  startedAt: string | null
  completedAt: string | null
  errorSummary: unknown
}

const fallbackError = <T>(message: string): APIResponse<T> => ({
  status: 'failure',
  message,
})

function parseFilenameFromDisposition(
  header: string | undefined
): string | null {
  if (!header) return null
  const utf8 = header.match(/filename\*=UTF-8''([^;\s]+)/i)
  if (utf8?.[1]) {
    try {
      return decodeURIComponent(utf8[1].replace(/['"]/g, ''))
    } catch {
      return utf8[1]
    }
  }
  const quoted = header.match(/filename="([^"]+)"/i)
  if (quoted?.[1]) return quoted[1]
  const plain = header.match(/filename=([^;\s]+)/i)
  if (plain?.[1]) return plain[1].replace(/['"]/g, '')
  return null
}

function defaultFileNameFromContentType(contentType: string): string {
  const mime = contentType.toLowerCase().split(';')[0]?.trim() ?? ''
  if (
    mime ===
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    mime.includes('spreadsheetml')
  ) {
    return 'upload_template.xlsx'
  }
  if (mime === 'text/csv' || mime.includes('csv')) {
    return 'upload_template.csv'
  }
  return 'upload_template'
}

function buildTemplateDownloadUrl(): string {
  const base = (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/$/, '')
  const path = Routes.uploadsTemplateDownload.replace(/^\//, '')
  return `${base}/${path}`
}

export async function downloadUploadTemplate(): Promise<
  { ok: true; fileName: string } | { ok: false; message: string }
> {
  if (typeof window === 'undefined') {
    return { ok: false, message: 'Download is only available in the browser' }
  }

  const url = buildTemplateDownloadUrl()
  if (!url || url.endsWith('/')) {
    return { ok: false, message: 'API base URL is not configured' }
  }

  const headers: Record<string, string> = {}
  const csrfToken = getCookieValue('csrfToken')
  if (csrfToken) {
    headers['x-csrf-token'] = csrfToken
  }

  try {
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers,
    })

    const contentTypeHeader =
      response.headers.get('content-type')?.toLowerCase() ?? ''

    if (!response.ok) {
      const text = await response.text()
      try {
        const json = JSON.parse(text) as { message?: string }
        return {
          ok: false,
          message: json.message ?? `Download failed (${response.status})`,
        }
      } catch {
        return {
          ok: false,
          message: text || `Download failed (${response.status})`,
        }
      }
    }

    if (contentTypeHeader.includes('application/json')) {
      const text = await response.text()
      try {
        const json = JSON.parse(text) as { message?: string }
        return { ok: false, message: json.message ?? 'Download failed' }
      } catch {
        return { ok: false, message: 'Download failed' }
      }
    }

    const disposition = response.headers.get('content-disposition') ?? undefined
    const fileName =
      parseFilenameFromDisposition(disposition) ??
      defaultFileNameFromContentType(contentTypeHeader)

    const blob = await response.blob()

    const serverMime =
      contentTypeHeader.split(';')[0]?.trim() ||
      (blob.type && blob.type !== 'application/octet-stream' ? blob.type : '')

    const downloadBlob =
      serverMime.length > 0
        ? new Blob([await blob.arrayBuffer()], { type: serverMime })
        : blob

    const objectUrl = URL.createObjectURL(downloadBlob)
    const anchor = document.createElement('a')
    anchor.href = objectUrl
    anchor.download = fileName
    anchor.rel = 'noopener'
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(objectUrl)

    return { ok: true, fileName }
  } catch {
    return { ok: false, message: 'Failed to download template' }
  }
}

export async function uploadTransactionFile(
  file: File
): Promise<APIResponse<UploadTransactionAccepted>> {
  try {
    const formData = new FormData()
    formData.append('file', file)

    const response = await api.post<APIResponse<UploadTransactionAccepted>>(
      Routes.uploadsTransactions,
      formData
    )
    return response.data
  } catch {
    return fallbackError<UploadTransactionAccepted>('Upload failed')
  }
}

export async function getUploadJobStatus(
  jobId: string
): Promise<APIResponse<UploadJobStatusData>> {
  try {
    const response = await api.get<APIResponse<UploadJobStatusData>>(
      Routes.uploadsJobStatus(jobId)
    )
    return response.data
  } catch {
    return fallbackError<UploadJobStatusData>('Failed to fetch job status')
  }
}
