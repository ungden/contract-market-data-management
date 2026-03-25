export type Role = 'admin' | 'sale_admin' | 'market_staff'

export interface UserProfile {
  id: string
  email: string
  display_name: string
  role: Role
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Customer {
  id: string
  name: string
  tax_code: string | null
  address: string | null
  bank_account: string | null
  legal_representative: string | null
  contact_person: string | null
  phone: string | null
  gps_lat: number | null
  gps_lng: number | null
  notes: string | null
  created_by: string
  creator_name: string
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  name: string
  origin: string | null
  unit: string
  created_by: string
  created_at: string
}

export interface TemplateField {
  name: string
  label: string
  type: 'text' | 'number' | 'date' | 'textarea'
}

export interface ContractTemplate {
  id: string
  name: string
  type: string
  description: string | null
  fields_json: string // JSON string of TemplateField[]
  created_by: string
  created_at: string
}

export interface Contract {
  id: string
  contract_no: string
  template_id: string
  template_name: string
  customer_id: string | null
  customer_name: string
  company_name: string
  data_json: string // JSON string of field values
  year: number
  status: 'draft' | 'active' | 'completed' | 'cancelled'
  created_by: string
  creator_name: string
  created_at: string
  updated_at: string
}

export interface ProductLine {
  product_id: string
  product_name: string
  unit: string
  daily_output: number | null
  price: number | null
}

export interface MarketVisit {
  id: string
  staff_id: string
  staff_name: string
  visit_date: string
  area: string | null
  customer_id: string | null
  customer_name: string | null
  shop_name: string
  address: string | null
  contact_person: string | null
  notes: string | null
  photo_urls: string[] | null
  gps_lat: number | null
  gps_lng: number | null
  product_lines: ProductLine[] | null
  created_at: string
}

export interface DailyReport {
  date: string
  staff_id: string
  staff_name: string
  total_visits: number
  visits: MarketVisit[]
}
