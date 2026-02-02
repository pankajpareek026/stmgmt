"use client"

import React, { createContext, useContext, useEffect, useMemo, useState } from "react"

export type CurrencyOption = {
    code: string
    locale: string
    symbol: string
    name: string
}

const CURRENCY_OPTIONS: CurrencyOption[] = [
    { code: "INR", locale: "en-IN", symbol: "₹", name: "Indian Rupee" },
    { code: "USD", locale: "en-US", symbol: "$", name: "US Dollar" },
    { code: "EUR", locale: "de-DE", symbol: "€", name: "Euro" },
    { code: "GBP", locale: "en-GB", symbol: "£", name: "British Pound" },
]

const STORAGE_KEY = "stmgmt.currency"
const DEFAULT_CURRENCY = CURRENCY_OPTIONS[0]

type CurrencyContextValue = {
    currency: CurrencyOption
    currencyOptions: CurrencyOption[]
    setCurrencyCode: (code: string) => void
    formatCurrency: (value: number, options?: Intl.NumberFormatOptions) => string
    formatCompact: (value: number, options?: Intl.NumberFormatOptions) => string
    formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null)

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
    const [currencyCode, setCurrencyCode] = useState<string>(DEFAULT_CURRENCY.code)

    useEffect(() => {
        const stored = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null
        if (stored) {
            setCurrencyCode(stored)
        }
    }, [])

    useEffect(() => {
        if (typeof window !== "undefined") {
            window.localStorage.setItem(STORAGE_KEY, currencyCode)
        }
    }, [currencyCode])

    const currency = useMemo(
        () => CURRENCY_OPTIONS.find((option) => option.code === currencyCode) || DEFAULT_CURRENCY,
        [currencyCode],
    )

    const formatCurrency = (value: number, options?: Intl.NumberFormatOptions) => {
        return new Intl.NumberFormat(currency.locale, {
            style: "currency",
            currency: currency.code,
            maximumFractionDigits: 0,
            ...options,
        }).format(Number.isFinite(value) ? value : 0)
    }

    const formatCompact = (value: number, options?: Intl.NumberFormatOptions) => {
        return new Intl.NumberFormat(currency.locale, {
            style: "currency",
            currency: currency.code,
            notation: "compact",
            maximumFractionDigits: 1,
            ...options,
        }).format(Number.isFinite(value) ? value : 0)
    }

    const formatNumber = (value: number, options?: Intl.NumberFormatOptions) => {
        return new Intl.NumberFormat(currency.locale, {
            maximumFractionDigits: 2,
            ...options,
        }).format(Number.isFinite(value) ? value : 0)
    }

    const contextValue = useMemo<CurrencyContextValue>(
        () => ({
            currency,
            currencyOptions: CURRENCY_OPTIONS,
            setCurrencyCode,
            formatCurrency,
            formatCompact,
            formatNumber,
        }),
        [currency, currencyCode],
    )

    return <CurrencyContext.Provider value={contextValue}>{children}</CurrencyContext.Provider>
}

export function useCurrency() {
    const context = useContext(CurrencyContext)
    if (!context) {
        throw new Error("useCurrency must be used within CurrencyProvider")
    }
    return context
}
