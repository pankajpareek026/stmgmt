"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight, Info } from "lucide-react"
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, startOfWeek, endOfWeek } from "date-fns"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

interface AttendanceRecord {
    date: string | Date
    status: "present" | "absent" | "half-day" | "overtime"
    hours?: number
    checkIn?: string
    checkOut?: string
    projectName?: string
}

interface AttendanceCalendarProps {
    records: AttendanceRecord[]
    className?: string
}

export function AttendanceCalendar({ records, className }: AttendanceCalendarProps) {
    const [currentMonth, setCurrentMonth] = React.useState(new Date())

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))

    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(monthStart)
    const startDate = startOfWeek(monthStart)
    const endDate = endOfWeek(monthEnd)

    const calendarDays = eachDayOfInterval({
        start: startDate,
        end: endDate,
    })

    // Group records by date string for easy lookup
    const recordMap = React.useMemo(() => {
        const map = new Map<string, AttendanceRecord[]>()
        records.forEach(rec => {
            const dateKey = format(new Date(rec.date), "yyyy-MM-dd")
            if (!map.has(dateKey)) map.set(dateKey, [])
            map.get(dateKey)?.push(rec)
        })
        return map
    }, [records])

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

    return (
        <div className={cn("bg-card border border-border rounded-xl overflow-hidden", className)}>
            {/* Calendar Header */}
            <div className="flex items-center justify-between p-4 border-b border-border/50 bg-muted/20">
                <h3 className="font-bold text-lg flex items-center gap-2">
                    {format(currentMonth, "MMMM yyyy")}
                </h3>
                <div className="flex gap-1">
                    <Button variant="outline" size="icon" className="h-8 w-8 bg-transparent" onClick={prevMonth}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="h-8 w-8 bg-transparent" onClick={nextMonth}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Day Names */}
            <div className="grid grid-cols-7 border-b border-border/50 bg-muted/5">
                {dayNames.map(day => (
                    <div key={day} className="py-2 text-center text-[10px] uppercase font-bold text-muted-foreground tracking-wider underline decoration-primary/20 underline-offset-4">
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 border-collapse">
                {calendarDays.map((day, idx) => {
                    const dateKey = format(day, "yyyy-MM-dd")
                    const dayRecords = recordMap.get(dateKey) || []
                    const isCurrentMonth = isSameMonth(day, monthStart)
                    const isToday = isSameDay(day, new Date())

                    return (
                        <div
                            key={idx}
                            className={cn(
                                "min-h-[70px] sm:min-h-[100px] border-r border-b border-border/50 p-1 transition-colors relative group",
                                !isCurrentMonth && "bg-muted/10 opacity-40",
                                isToday && "bg-primary/5"
                            )}
                        >
                            <div className="flex justify-between items-start">
                                <span className={cn(
                                    "text-[11px] font-medium px-1.5 py-0.5 rounded-full",
                                    isToday ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                                )}>
                                    {format(day, "d")}
                                </span>
                            </div>

                            <div className="mt-1.5 space-y-1">
                                {dayRecords.map((rec, i) => (
                                    <TooltipProvider key={i}>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div className={cn(
                                                    "w-full px-1.5 py-1 rounded-[4px] text-[9px] font-bold truncate transition-transform hover:scale-105 cursor-default flex items-center gap-1 border-l-2",
                                                    (rec.status === "present" || rec.status === "overtime") && "bg-green-500/10 text-green-600 border-green-500",
                                                    rec.status === "half-day" && "bg-yellow-500/10 text-yellow-600 border-yellow-500",
                                                    rec.status === "absent" && "bg-red-500/10 text-red-600 border-red-500"
                                                )}>
                                                    <div className={cn("w-1 h-1 rounded-full",
                                                        (rec.status === "present" || rec.status === "overtime") ? "bg-green-500" :
                                                            rec.status === "half-day" ? "bg-yellow-500" : "bg-red-500"
                                                    )} />
                                                    <span className="truncate">{rec.projectName || rec.status}</span>
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent side="top" className="p-3 max-w-[200px] bg-popover border border-border shadow-xl">
                                                <div className="space-y-2">
                                                    <div className="flex justify-between items-center border-b border-border/50 pb-1">
                                                        <span className="font-bold text-xs capitalize">{rec.status}</span>
                                                        <span className="text-[10px] text-muted-foreground">{format(day, "PPP")}</span>
                                                    </div>
                                                    <div className="text-[11px] space-y-1">
                                                        <p className="font-semibold text-primary">{rec.projectName || "General Work"}</p>
                                                        {(rec.status !== 'absent' && rec.status !== 'overtime') && (
                                                            <div className="flex gap-3 text-muted-foreground">
                                                                <span>In: {rec.checkIn || '08:00'}</span>
                                                                <span>Out: {rec.checkOut || '17:00'}</span>
                                                            </div>
                                                        )}
                                                        {rec.status === 'overtime' && (
                                                            <div className="flex gap-3 text-muted-foreground">
                                                                <span>Hours: {rec.hours}h</span>
                                                                <Badge variant="outline" className="text-[9px] h-4 px-1 bg-green-50">Overtime</Badge>
                                                            </div>
                                                        )}
                                                        <p className="text-muted-foreground">{rec.hours || (rec.status === 'half-day' ? 4 : 8)}h reported</p>
                                                    </div>
                                                </div>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                ))}
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Legend */}
            <div className="p-4 bg-muted/10 border-t border-border/50 flex flex-wrap gap-4 justify-center sm:justify-start">
                <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    <div className="w-2 h-2 rounded-full bg-green-500" /> Present
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    <div className="w-2 h-2 rounded-full bg-yellow-400" /> Half-Day
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    <div className="w-2 h-2 rounded-full bg-red-500" /> Absent
                </div>
            </div>
        </div>
    )
}
