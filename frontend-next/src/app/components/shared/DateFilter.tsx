'use client'

import { Icon } from '@iconify/react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Label } from '@/components/ui/label'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'

type DateFilterProps = {
    label: string
    value: string
    onChange: (value: string) => void
    startMonth?: Date
    endMonth?: Date
}

const formatDateValue = (date?: Date) => {
    if (!date) return ''

    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
}

const parseDateValue = (value: string) => {
    if (!value) return undefined

    const [year, month, day] = value.split('-').map(Number)
    if (!year || !month || !day) return undefined

    return new Date(year, month - 1, day)
}

const displayDateValue = (value: string) => value.replaceAll('-', '/')

const DateFilter = ({
    label,
    value,
    onChange,
    startMonth = new Date(1926, 0, 1),
    endMonth = new Date(2026, 11, 31),
}: DateFilterProps) => (
    <div className="space-y-1.5">
        <Label>{label}</Label>
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    className="h-10 w-full justify-between px-3 text-left font-normal text-slate-900 hover:text-white"
                >
                    <span className="leading-none">
                        {value ? displayDateValue(value) : '请选择'}
                    </span>
                    <Icon
                        icon="ic:round-calendar-today"
                        className="text-base"
                    />
                </Button>
            </PopoverTrigger>
            <PopoverContent
                align="start"
                className="w-auto p-0"
            >
                <Calendar
                    mode="single"
                    selected={parseDateValue(value)}
                    onSelect={(date) => onChange(formatDateValue(date))}
                    captionLayout="dropdown"
                    startMonth={startMonth}
                    endMonth={endMonth}
                    styles={{
                        dropdown: {
                            maxHeight: '15rem',
                            overflowY: 'auto',
                        },
                    }}
                />
                <div className="border-border flex items-center justify-between border-t p-2">
                    <Button
                        type="button"
                        variant="ghostprimary"
                        size="sm"
                        onClick={() => onChange('')}
                    >
                        清除
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onChange(formatDateValue(new Date()))}
                    >
                        今天
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    </div>
)

export default DateFilter
