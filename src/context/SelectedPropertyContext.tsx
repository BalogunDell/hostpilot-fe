import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from './AuthContext'
import { useApi } from '../hooks/useApi'

const STORAGE_KEY = 'hostsledger_selected_property'

export interface SelectableProperty {
  id: string
  name: string
  location?: string
}

interface SelectedPropertyContextValue {
  properties: SelectableProperty[]
  propertiesLoading: boolean
  selectedPropertyId: string | null
  selectedProperty: SelectableProperty | null
  setSelectedPropertyId: (propertyId: string) => void
  /** True when properties exist but none is chosen yet (show picker modal). */
  needsPropertySelection: boolean
}

const SelectedPropertyContext = createContext<SelectedPropertyContextValue | null>(null)

function readStoredPropertyId(): string | null {
  try {
    return sessionStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

export function SelectedPropertyProvider({ children }: { children: ReactNode }) {
  const api = useApi()
  const { token } = useAuth()
  const [selectedPropertyId, setSelectedPropertyIdState] = useState<string | null>(readStoredPropertyId)

  const propertiesQuery = useQuery({
    queryKey: ['properties'],
    queryFn: () => api<SelectableProperty[]>('/properties'),
    enabled: Boolean(token),
  })

  const properties = propertiesQuery.data ?? []

  const setSelectedPropertyId = useCallback((propertyId: string) => {
    setSelectedPropertyIdState(propertyId)
    try {
      sessionStorage.setItem(STORAGE_KEY, propertyId)
    } catch {
      // Ignore storage failures
    }
  }, [])

  useEffect(() => {
    if (!token) {
      setSelectedPropertyIdState(null)
      try {
        sessionStorage.removeItem(STORAGE_KEY)
      } catch {
        // Ignore
      }
    }
  }, [token])

  useEffect(() => {
    if (propertiesQuery.isLoading || properties.length === 0) return
    if (selectedPropertyId && properties.some((property) => property.id === selectedPropertyId)) {
      return
    }
    // Stored id missing/invalid — clear so the picker can run.
    if (selectedPropertyId) {
      setSelectedPropertyIdState(null)
      try {
        sessionStorage.removeItem(STORAGE_KEY)
      } catch {
        // Ignore
      }
    }
  }, [properties, propertiesQuery.isLoading, selectedPropertyId])

  const selectedProperty =
    properties.find((property) => property.id === selectedPropertyId) ?? null

  const needsPropertySelection =
    Boolean(token) &&
    !propertiesQuery.isLoading &&
    properties.length > 0 &&
    !selectedPropertyId

  const value = useMemo(
    () => ({
      properties,
      propertiesLoading: propertiesQuery.isLoading,
      selectedPropertyId,
      selectedProperty,
      setSelectedPropertyId,
      needsPropertySelection,
    }),
    [
      properties,
      propertiesQuery.isLoading,
      selectedPropertyId,
      selectedProperty,
      setSelectedPropertyId,
      needsPropertySelection,
    ],
  )

  return (
    <SelectedPropertyContext.Provider value={value}>{children}</SelectedPropertyContext.Provider>
  )
}

export function useSelectedProperty() {
  const context = useContext(SelectedPropertyContext)
  if (!context) {
    throw new Error('useSelectedProperty must be used within SelectedPropertyProvider')
  }
  return context
}
