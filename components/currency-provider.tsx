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
    syncCurrencyFromUser: (userCurrency: string) => void
    formatCurrency: (value: number, options?: Intl.NumberFormatOptions) => string
    formatCompact: (value: number, options?: Intl.NumberFormatOptions) => string
    formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null)

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
    const [currencyCode, setCurrencyCode] = useState<string>(DEFAULT_CURRENCY.code)
    const [isInitialized, setIsInitialized] = useState(false)

    // Initialize currency - fetch from DB if logged in, else use localStorage
    useEffect(() => {
        const initializeCurrency = async () => {
            try {
                const token = typeof window !== "undefined" ? window.localStorage.getItem("token") : null

                if (token) {
                    // User is logged in, fetch from database
                    const response = await fetch("/api/auth/settings", {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    })

                    if (response.ok) {
                        const result = await response.json()
                        if (result.success && result.data?.currency) {
                            setCurrencyCode(result.data.currency)
                            // Also update localStorage for offline access
                            if (typeof window !== "undefined") {
                                window.localStorage.setItem(STORAGE_KEY, result.data.currency)
                            }
                            setIsInitialized(true)
                            return
                        }
                    }
                }

                // Fallback to localStorage (if not logged in or API failed)
                const stored = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null
                if (stored) {
                    setCurrencyCode(stored)
                }
            } catch (error) {
                console.error("Error initializing currency:", error)
                // Fallback to localStorage
                const stored = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null
                if (stored) {
                    setCurrencyCode(stored)
                }
            } finally {
                setIsInitialized(true)
            }
        }

        initializeCurrency()
    }, [])

    // Sync to localStorage when changed
    useEffect(() => {
        if (isInitialized && typeof window !== "undefined") {
            window.localStorage.setItem(STORAGE_KEY, currencyCode)
        }
    }, [currencyCode, isInitialized])

    // Function to sync currency from user data (called from settings or auth)
    const syncCurrencyFromUser = (userCurrency: string) => {
        if (userCurrency && CURRENCY_OPTIONS.find(opt => opt.code === userCurrency)) {
            setCurrencyCode(userCurrency)
        }
    }

    // Wrapper function to update currency in both localStorage and database
    const updateCurrencyCode = async (code: string) => {
        setCurrencyCode(code)

        // Update localStorage
        if (typeof window !== "undefined") {
            window.localStorage.setItem(STORAGE_KEY, code)
        }

        // Update database if user is logged in
        try {
            const token = typeof window !== "undefined" ? window.localStorage.getItem("token") : null
            if (token) {
                await fetch("/api/auth/settings", {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ currency: code }),
                })
            }
        } catch (error) {
            console.error("Error updating currency in database:", error)
            // Continue even if database update fails, localStorage is updated
        }
    }

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
            setCurrencyCode: updateCurrencyCode,
            syncCurrencyFromUser,
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
