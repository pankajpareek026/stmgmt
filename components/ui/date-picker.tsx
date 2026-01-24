"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
    date?: Date
    setDate?: (date?: Date) => void
    dates?: Date[]
    setDates?: (dates?: Date[]) => void
    mode?: "single" | "multiple"
    label?: string
    placeholder?: string
    className?: string
}

export function DatePicker({ date, setDate, dates, setDates, mode = "single", label, placeholder = "Pick a date", className }: DatePickerProps) {
    const isMultiple = mode === "multiple"

    return (
        <div className={cn("grid gap-2", className)}>
            {label && <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{label}</label>}
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        variant={"outline"}
                        className={cn(
                            "w-full justify-start text-left font-normal h-10 bg-transparent border-input hover:bg-muted/50 hover:text-primary transition-colors",
                            (!date && !dates?.length) && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                        {isMultiple ? (
                            dates && dates.length > 0 ? (
                                <span>{dates.length} dates selected</span>
                            ) : (
                                <span>{placeholder}</span>
                            )
                        ) : (
                            date ? format(date, "PPP") : <span>{placeholder}</span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        mode={mode as any}
                        selected={(isMultiple ? dates : date) as any}
                        onSelect={(isMultiple ? setDates : setDate) as any}
                        initialFocus
                    />
                </PopoverContent>
            </Popover>
        </div>
    )
}
