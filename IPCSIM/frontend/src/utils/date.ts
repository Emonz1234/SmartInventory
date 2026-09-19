const VIETNAM_TIME_ZONE = 'Asia/Ho_Chi_Minh'

const dateTimeFormatter = new Intl.DateTimeFormat('vi-VN', {
  timeZone: VIETNAM_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit'
})

const timeFormatter = new Intl.DateTimeFormat('vi-VN', {
  timeZone: VIETNAM_TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit'
})

const isVietnamFormattedDate = (value: string): boolean => {
  return /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value)
}

export const parseVietnamDate = (value?: string | null): Date | null => {
  if (!value) return null

  const trimmed = value.trim()
  if (isVietnamFormattedDate(trimmed)) {
    const date = new Date(trimmed.replace(' ', 'T') + '+07:00')
    return Number.isNaN(date.getTime()) ? null : date
  }

  const date = new Date(trimmed)
  return Number.isNaN(date.getTime()) ? null : date
}

export const formatDateTime = (value?: string | null): string => {
  if (!value) return '--'
  const trimmed = value.trim()

  if (isVietnamFormattedDate(trimmed)) {
    return trimmed
  }

  const date = parseVietnamDate(trimmed)
  return date ? dateTimeFormatter.format(date) : trimmed
}

export const formatTimeShort = (value?: string | null): string => {
  if (!value) return '--'

  const date = parseVietnamDate(value)
  if (!date) return '--'

  return timeFormatter.format(date)
}
