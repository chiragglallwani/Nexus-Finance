'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import {
  downloadUploadTemplate,
  getUploadJobStatus,
  uploadTransactionFile,
} from '@/services/uploads/uploadService'
import { Button } from '@/components/ui/button'

const ACCEPT =
  '.csv,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv'

const STATUS_POLL_MS = 15_000

function isAllowedFile(file: File): boolean {
  const name = file.name.toLowerCase()
  if (!name.endsWith('.csv') && !name.endsWith('.xlsx')) return false
  if (!file.type) return true
  const ok =
    file.type === 'text/csv' ||
    file.type === 'application/vnd.ms-excel' ||
    file.type ===
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  return ok || file.type === 'application/octet-stream'
}

function Uploads() {
  const inputRef = useRef<HTMLInputElement>(null)
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pollInFlightRef = useRef(false)

  const [isDownloading, setIsDownloading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  /** True after submit until job is COMPLETED or FAILED (or polling errors out). */
  const [isProcessing, setIsProcessing] = useState(false)
  const [activeJobId, setActiveJobId] = useState<string | null>(null)
  const [jobStatusLabel, setJobStatusLabel] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current != null) {
      clearInterval(pollIntervalRef.current)
      pollIntervalRef.current = null
    }
  }, [])

  useEffect(() => {
    return () => stopPolling()
  }, [stopPolling])

  const handleDownloadTemplate = async () => {
    setIsDownloading(true)
    const result = await downloadUploadTemplate()
    setIsDownloading(false)
    if (result.ok) {
      toast.success('Template downloaded')
    } else {
      toast.error(result.message)
    }
  }

  const pollJobStatus = useCallback(
    async (jobId: string) => {
      if (pollInFlightRef.current) return
      pollInFlightRef.current = true
      try {
        const res = await getUploadJobStatus(jobId)
        if (res.status !== 'success' || !res.data) {
          stopPolling()
          setIsProcessing(false)
          setActiveJobId(null)
          setJobStatusLabel(null)
          toast.error(res.message)
          return
        }

        const { status } = res.data
        setJobStatusLabel(status)

        if (status === 'COMPLETED') {
          stopPolling()
          setIsProcessing(false)
          setActiveJobId(null)
          setJobStatusLabel(null)
          setSelectedFile(null)
          if (inputRef.current) inputRef.current.value = ''
          toast.success('Import completed')
          return
        }

        if (status === 'FAILED') {
          stopPolling()
          setIsProcessing(false)
          setActiveJobId(null)
          setJobStatusLabel(null)
          toast.error(res.message || 'Import failed')
        }
      } finally {
        pollInFlightRef.current = false
      }
    },
    [stopPolling]
  )

  const startPolling = useCallback(
    (jobId: string) => {
      stopPolling()
      setActiveJobId(jobId)
      void pollJobStatus(jobId)
      pollIntervalRef.current = setInterval(() => {
        void pollJobStatus(jobId)
      }, STATUS_POLL_MS)
    },
    [pollJobStatus, stopPolling]
  )

  const handleSubmitUpload = async () => {
    if (!selectedFile) {
      toast.error('Choose a file first.')
      return
    }
    if (!isAllowedFile(selectedFile)) {
      toast.error('Only CSV or XLSX files are allowed.')
      return
    }

    setIsProcessing(true)
    setJobStatusLabel(null)
    setActiveJobId(null)

    const response = await uploadTransactionFile(selectedFile)

    if (response.status !== 'accepted' && response.status !== 'success') {
      setIsProcessing(false)
      toast.error(response.message)
      return
    }

    const jobId = response.data?.jobId
    if (!jobId) {
      setIsProcessing(false)
      toast.error('Upload accepted but no job ID was returned.')
      return
    }

    toast.success(response.message)
    startPolling(jobId)
  }

  const onFilePicked = (file: File | undefined) => {
    if (isProcessing) return
    if (!file) return
    if (!isAllowedFile(file)) {
      toast.error('Only CSV or XLSX files are allowed.')
      return
    }
    setSelectedFile(file)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilePicked(e.target.files?.[0])
  }

  const handleDragOver = (e: React.DragEvent) => {
    if (isProcessing) return
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDragLeave = (e: React.DragEvent) => {
    if (isProcessing) return
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    if (isProcessing) return
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    onFilePicked(file)
  }

  const openFilePicker = () => {
    if (isProcessing) return
    inputRef.current?.click()
  }

  const clearSelectedFile = () => {
    if (isProcessing) return
    setSelectedFile(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <section className="surface-container-low space-y-4 rounded-lg p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="title-lg">Uploads</h2>
        <button
          type="button"
          className="border-border bg-secondary text-secondary-foreground hover:bg-secondary/90 inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium disabled:opacity-50"
          disabled={isDownloading || isProcessing}
          onClick={() => void handleDownloadTemplate()}
        >
          {isDownloading ? 'Downloading…' : 'Download template'}
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        disabled={isProcessing}
        onChange={handleInputChange}
      />

      <div
        role="button"
        tabIndex={isProcessing ? -1 : 0}
        onKeyDown={(e) => {
          if (isProcessing) return
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            openFilePicker()
          }
        }}
        onDragEnter={(e) => {
          if (isProcessing) return
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragOver={(e) => {
          handleDragOver(e)
          setIsDragging(true)
        }}
        onDragLeave={(e) => {
          handleDragLeave(e)
        }}
        onDrop={handleDrop}
        onClick={() => openFilePicker()}
        className={`border-border bg-background flex min-h-[160px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors ${
          isDragging && !isProcessing ? 'border-primary bg-primary/5' : ''
        } ${isProcessing ? 'pointer-events-none cursor-not-allowed opacity-60' : ''}`}
      >
        <p className="body-md text-muted-foreground">
          Drag and drop a file here, or click to browse
        </p>
        <p className="text-muted-foreground mt-2 text-sm">
          CSV or XLSX only — max 50 MB
        </p>
        {selectedFile && (
          <p className="body-md mt-3 font-medium">{selectedFile.name}</p>
        )}
        {isProcessing && (
          <div className="text-muted-foreground mt-3 space-y-1 text-sm">
            <p>Upload queued — checking import status every 15s…</p>
            {activeJobId && <p>Job ID: {activeJobId}</p>}
            {jobStatusLabel && <p>Status: {jobStatusLabel}</p>}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          disabled={!selectedFile || isProcessing}
          onClick={() => void handleSubmitUpload()}
        >
          Submit upload
        </Button>
        <Button
          variant="ghost"
          className="border-border hover:bg-muted/50 inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium disabled:opacity-50"
          disabled={!selectedFile || isProcessing}
          onClick={clearSelectedFile}
        >
          Clear file
        </Button>
      </div>
    </section>
  )
}

export default Uploads
