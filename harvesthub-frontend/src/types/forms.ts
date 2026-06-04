export interface ContactFormData {
    customerName: string
    customerPhone: string
    customerEmail: string
}

export interface AddressFormData {
    street: string
    apartment?: string
    entrance?: string
    floor?: string
    intercom?: string
    city: string
    postalCode: string
}

export interface CreateOrderRequest {
    customerName: string
    customerPhone: string
    customerEmail: string
    shippingAddress: AddressFormData
    deliveryDate: string
    deliveryTime: string
    paymentMethod: 'card' | 'cash' | 'online'
    notes?: string
}