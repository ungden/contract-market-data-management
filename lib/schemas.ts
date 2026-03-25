import { z } from 'zod'

export const customerSchema = z.object({
  name: z.string().min(1, 'Tên khách hàng không được để trống'),
  tax_code: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  bank_account: z.string().optional().nullable(),
  legal_representative: z.string().optional().nullable(),
  contact_person: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  gps_lat: z.number().optional().nullable(),
  gps_lng: z.number().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export const productSchema = z.object({
  name: z.string().min(1, 'Tên sản phẩm không được để trống'),
  origin: z.string().optional().nullable(),
  unit: z.string().min(1, 'Đơn vị không được để trống'),
})

export const contractSchema = z.object({
  contract_no: z.string().min(1, 'Số hợp đồng không được để trống'),
  template_id: z.string().min(1, 'Chọn loại hợp đồng'),
  customer_id: z.string().optional().nullable(),
  customer_name: z.string().min(1, 'Tên khách hàng không được để trống'),
  company_name: z.string().min(1, 'Tên công ty không được để trống'),
  status: z.enum(['draft', 'active', 'completed', 'cancelled']),
})

export const productLineSchema = z.object({
  product_id: z.string().min(1, 'Chọn sản phẩm'),
  product_name: z.string(),
  unit: z.string(),
  daily_output: z.number().optional().nullable(),
  price: z.number().optional().nullable(),
})

export const marketVisitSchema = z.object({
  shop_name: z.string().min(1, 'Tên cửa hàng không được để trống'),
  customer_id: z.string().optional().nullable(),
  customer_name: z.string().optional().nullable(),
  area: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  contact_person: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  gps_lat: z.number().optional().nullable(),
  gps_lng: z.number().optional().nullable(),
  product_lines: z.array(productLineSchema).optional().nullable(),
})

export const userSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  display_name: z.string().min(1, 'Tên hiển thị không được để trống'),
  role: z.enum(['admin', 'sale_admin', 'market_staff']),
  is_active: z.boolean(),
})

export const templateSchema = z.object({
  name: z.string().min(1, 'Tên mẫu không được để trống'),
  type: z.string().min(1, 'Loại mẫu không được để trống'),
  description: z.string().optional().nullable(),
})

export type CustomerInput = z.infer<typeof customerSchema>
export type ProductInput = z.infer<typeof productSchema>
export type ContractInput = z.infer<typeof contractSchema>
export type MarketVisitInput = z.infer<typeof marketVisitSchema>
export type UserInput = z.infer<typeof userSchema>
export type TemplateInput = z.infer<typeof templateSchema>
