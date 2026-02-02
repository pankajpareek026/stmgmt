"use client"

import { Settings } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useCurrency } from "@/components/currency-provider"

export default function SettingsPage() {
    const { currency, currencyOptions, setCurrencyCode, formatCurrency, formatCompact } = useCurrency()

    return (
        <div className="container mx-auto max-w-2xl py-8">
            <div className="flex items-center gap-2 mb-6 text-2xl font-bold">
                <Settings className="h-8 w-8 text-primary" />
                <h1>Settings</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Currency</CardTitle>
                    <CardDescription>Select the default currency used across the app</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-col gap-2">
                        <Select value={currency.code} onValueChange={setCurrencyCode}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select currency" />
                            </SelectTrigger>
                            <SelectContent>
                                {currencyOptions.map((option) => (
                                    <SelectItem key={option.code} value={option.code}>
                                        {option.name} ({option.code}) {option.symbol}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="rounded-lg border border-border bg-secondary/30 p-4">
                        <p className="text-xs text-muted-foreground mb-2">Preview</p>
                        <div className="flex items-center justify-between">
                            <span className="text-sm">Standard</span>
                            <span className="font-semibold">{formatCurrency(123456)}</span>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                            <span className="text-sm">Compact</span>
                            <span className="font-semibold">{formatCompact(123456)}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
