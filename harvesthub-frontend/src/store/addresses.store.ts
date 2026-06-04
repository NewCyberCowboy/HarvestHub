import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { AddressDto, CreateAddressDto, UpdateAddressDto } from '@/types/backend'

interface AddressesStore {
    addresses: AddressDto[]
    isLoading: boolean
    error: string | null

    // Actions
    setAddresses: (addresses: AddressDto[]) => void
    addAddress: (address: AddressDto) => void
    updateAddress: (id: number, updates: UpdateAddressDto) => void
    setDefaultAddress: (id: number) => void
    removeAddress: (id: number) => void
    setLoading: (loading: boolean) => void
    setError: (error: string | null) => void
    clearError: () => void

    // API Actions
    fetchAddresses: () => Promise<void>
    createAddress: (addressData: CreateAddressDto) => Promise<AddressDto>
    editAddress: (id: number, addressData: UpdateAddressDto) => Promise<void>
    deleteAddress: (id: number) => Promise<void>
    setAddressAsDefault: (id: number) => Promise<void>
    getDefaultAddress: () => AddressDto | null
}

export const useAddressesStore = create<AddressesStore>()(
    persist(
        (set, get) => ({
            addresses: [],
            isLoading: false,
            error: null,

            setAddresses: (addresses) => set({ addresses }),

            addAddress: (address) => set((state) => ({
                addresses: [...state.addresses, address]
            })),

            updateAddress: (id, updates) => set((state) => ({
                addresses: state.addresses.map(address =>
                    address.addressId === id
                        ? { ...address, ...updates, updatedAt: new Date().toISOString() }
                        : address
                )
            })),

            setDefaultAddress: (id) => set((state) => ({
                addresses: state.addresses.map(address => ({
                    ...address,
                    isDefault: address.addressId === id
                }))
            })),

            removeAddress: (id) => set((state) => ({
                addresses: state.addresses.filter(address => address.addressId !== id)
            })),

            setLoading: (loading) => set({ isLoading: loading }),
            setError: (error) => set({ error }),
            clearError: () => set({ error: null }),

            // API Actions
            fetchAddresses: async () => {
                set({ isLoading: true, error: null })
                try {
                    const { addressesApi } = await import('@/api/addresses.api')
                    const addresses = await addressesApi.getAddresses()
                    set({ addresses, isLoading: false })
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch addresses'
                    set({ error: errorMessage, isLoading: false })
                    throw error
                }
            },

            createAddress: async (addressData) => {
                set({ isLoading: true, error: null })
                try {
                    const { addressesApi } = await import('@/api/addresses.api')
                    const newAddress = await addressesApi.createAddress(addressData)

                    // Если новый адрес основной, сбрасываем другие
                    if (addressData.isDefault) {
                        set((state) => ({
                            addresses: state.addresses.map(addr => ({
                                ...addr,
                                isDefault: false
                            }))
                        }))
                    }

                    set((state) => ({
                        addresses: [...state.addresses, newAddress],
                        isLoading: false
                    }))

                    return newAddress
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Failed to create address'
                    set({ error: errorMessage, isLoading: false })
                    throw error
                }
            },

            editAddress: async (id, addressData) => {
                set({ isLoading: true, error: null })
                try {
                    const { addressesApi } = await import('@/api/addresses.api')
                    await addressesApi.updateAddress(id, addressData)

                    // Обновляем в сторе
                    set((state) => ({
                        addresses: state.addresses.map(address =>
                            address.addressId === id
                                ? { ...address, ...addressData, updatedAt: new Date().toISOString() }
                                : address
                        ),
                        isLoading: false
                    }))

                    // Если установили как основной, обновляем другие
                    if (addressData.isDefault) {
                        set((state) => ({
                            addresses: state.addresses.map(address => ({
                                ...address,
                                isDefault: address.addressId === id
                            }))
                        }))
                    }
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Failed to update address'
                    set({ error: errorMessage, isLoading: false })
                    throw error
                }
            },

            deleteAddress: async (id) => {
                set({ isLoading: true, error: null })
                try {
                    const { addressesApi } = await import('@/api/addresses.api')
                    await addressesApi.deleteAddress(id)

                    const addressToDelete = get().addresses.find(a => a.addressId === id)

                    // Если удаляем основной адрес и есть другие адресы
                    if (addressToDelete?.isDefault && get().addresses.length > 1) {
                        // Находим следующий адрес и делаем его основным
                        const nextAddress = get().addresses.find(a => a.addressId !== id)
                        if (nextAddress) {
                            await get().setAddressAsDefault(nextAddress.addressId)
                        }
                    }

                    set((state) => ({
                        addresses: state.addresses.filter(address => address.addressId !== id),
                        isLoading: false
                    }))
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Failed to delete address'
                    set({ error: errorMessage, isLoading: false })
                    throw error
                }
            },

            setAddressAsDefault: async (id) => {
                set({ isLoading: true, error: null })
                try {
                    const { addressesApi } = await import('@/api/addresses.api')
                    await addressesApi.setDefaultAddress(id)

                    set((state) => ({
                        addresses: state.addresses.map(address => ({
                            ...address,
                            isDefault: address.addressId === id
                        })),
                        isLoading: false
                    }))
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Failed to set default address'
                    set({ error: errorMessage, isLoading: false })
                    throw error
                }
            },

            getDefaultAddress: () => {
                return get().addresses.find(address => address.isDefault) || null
            }
        }),
        {
            name: 'harvesthub-addresses-storage',
            version: 1,
        }
    )
)