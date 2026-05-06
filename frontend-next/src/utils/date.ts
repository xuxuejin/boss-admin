export type DateFormat =
    | 'standard'
    | 'chinese'
    | 'slash'
    | 'iso'
    | 'us'
    | 'timeOnly'
    | 'custom'

export interface FormatDateTimeOptions {
    format?: DateFormat
    locale?: string
    customPattern?: string
}

const DEFAULT_LOCALE = 'zh-CN'

const pad = (value: number) => String(value).padStart(2, '0')

const normalizeTimestamp = (timestamp?: number | string | null) => {
    if (timestamp === null || timestamp === undefined || timestamp === '') {
        return null
    }

    const numericTimestamp = Number(timestamp)
    if (!Number.isFinite(numericTimestamp) || numericTimestamp === 0) {
        return null
    }

    return numericTimestamp < 1000000000000
        ? numericTimestamp * 1000
        : numericTimestamp
}

const getDateParts = (date: Date, locale: string, hour12 = false) => {
    const formatter = new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12,
    })

    const parts = formatter.formatToParts(date)

    const read = (type: Intl.DateTimeFormatPartTypes) =>
        parts.find((part) => part.type === type)?.value ?? ''

    return {
        year: read('year'),
        month: read('month'),
        day: read('day'),
        hour: read('hour'),
        minute: read('minute'),
        second: read('second'),
        dayPeriod: read('dayPeriod'),
    }
}

const formatCustom = (date: Date, pattern: string) => {
    const map: Record<string, string> = {
        YYYY: date.getFullYear().toString(),
        MM: pad(date.getMonth() + 1),
        DD: pad(date.getDate()),
        HH: pad(date.getHours()),
        mm: pad(date.getMinutes()),
        ss: pad(date.getSeconds()),
    }

    return pattern.replace(/YYYY|MM|DD|HH|mm|ss/g, (token) => map[token])
}

export function formatDateTime(
    timestamp?: number | string | null,
    options: FormatDateTimeOptions = {},
) {
    const normalizedTimestamp = normalizeTimestamp(timestamp)
    if (normalizedTimestamp === null) return '-'

    const date = new Date(normalizedTimestamp)
    if (Number.isNaN(date.getTime())) {
        return '无效日期'
    }

    const {
        format = 'standard',
        locale = DEFAULT_LOCALE,
        customPattern,
    } = options

    if (format === 'iso') {
        return date.toISOString()
    }

    if (format === 'custom' && customPattern) {
        return formatCustom(date, customPattern)
    }

    if (format === 'timeOnly') {
        const { hour, minute, second } = getDateParts(date, locale)
        return `${hour}:${minute}:${second}`
    }

    if (format === 'us') {
        const { month, day, year, hour, minute, second, dayPeriod } =
            getDateParts(date, locale, true)

        return `${month}/${day}/${year} ${hour}:${minute}:${second}${dayPeriod ? ` ${dayPeriod}` : ''}`
    }

    const year = date.getFullYear()
    const month = pad(date.getMonth() + 1)
    const day = pad(date.getDate())
    const hour = date.getHours()
    const minute = pad(date.getMinutes())
    const second = pad(date.getSeconds())

    switch (format) {
        case 'chinese':
            return `${year}年${month}月${day}日 ${hour}:${minute}:${second}`
        case 'slash':
            return `${year}/${month}/${day} ${pad(hour)}:${minute}:${second}`
        case 'standard':
        default:
            return `${year}-${month}-${day} ${hour}:${minute}:${second}`
    }
}
