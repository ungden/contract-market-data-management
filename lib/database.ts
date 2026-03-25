import { supabase } from './supabase'
import type {
  UserProfile,
  Customer,
  Product,
  ContractTemplate,
  Contract,
  MarketVisit,
} from './types'

// ============================================
// Users
// ============================================

export async function getUsers() {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as UserProfile[]
}

export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()
  if (error) throw error
  return data as UserProfile
}

export async function updateUser(
  userId: string,
  updates: Partial<Pick<UserProfile, 'role' | 'is_active' | 'display_name'>>
) {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()
  if (error) throw error
  return data as UserProfile
}

export async function preCreateUser(email: string, role: string) {
  const { data, error } = await supabase
    .from('users')
    .insert({
      id: crypto.randomUUID(),
      email,
      display_name: email,
      role,
      is_active: true,
    })
    .select()
    .single()
  if (error) throw error
  return data as UserProfile
}

// ============================================
// Customers
// ============================================

export async function getCustomers() {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as Customer[]
}

export async function getCustomer(id: string) {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data as Customer
}

export async function addCustomer(
  customer: Omit<Customer, 'id' | 'created_at' | 'updated_at'>
) {
  const { data, error } = await supabase
    .from('customers')
    .insert(customer)
    .select()
    .single()
  if (error) throw error
  return data as Customer
}

export async function updateCustomer(
  id: string,
  updates: Partial<Customer>
) {
  const { data, error } = await supabase
    .from('customers')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as Customer
}

export async function deleteCustomer(id: string) {
  const { error } = await supabase.from('customers').delete().eq('id', id)
  if (error) throw error
}

export async function searchCustomers(query: string) {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .or(`name.ilike.%${query}%,phone.ilike.%${query}%`)
    .order('name')
    .limit(20)
  if (error) throw error
  return data as Customer[]
}

// ============================================
// Products
// ============================================

export async function getProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('name')
  if (error) throw error
  return data as Product[]
}

export async function addProduct(
  product: Omit<Product, 'id' | 'created_at'>
) {
  const { data, error } = await supabase
    .from('products')
    .insert(product)
    .select()
    .single()
  if (error) throw error
  return data as Product
}

export async function updateProduct(
  id: string,
  updates: Partial<Product>
) {
  const { data, error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as Product
}

export async function deleteProduct(id: string) {
  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) throw error
}

// ============================================
// Contract Templates
// ============================================

export async function getTemplates() {
  const { data, error } = await supabase
    .from('contract_templates')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as ContractTemplate[]
}

export async function addTemplate(
  template: Omit<ContractTemplate, 'id' | 'created_at'>
) {
  const { data, error } = await supabase
    .from('contract_templates')
    .insert(template)
    .select()
    .single()
  if (error) throw error
  return data as ContractTemplate
}

export async function deleteTemplate(id: string) {
  const { error } = await supabase
    .from('contract_templates')
    .delete()
    .eq('id', id)
  if (error) throw error
}

// ============================================
// Contracts
// ============================================

export async function getContracts() {
  const { data, error } = await supabase
    .from('contracts')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as Contract[]
}

export async function getContract(id: string) {
  const { data, error } = await supabase
    .from('contracts')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data as Contract
}

export async function addContract(
  contract: Omit<Contract, 'id' | 'created_at' | 'updated_at'>
) {
  const { data, error } = await supabase
    .from('contracts')
    .insert(contract)
    .select()
    .single()
  if (error) throw error
  return data as Contract
}

export async function updateContract(
  id: string,
  updates: Partial<Contract>
) {
  const { data, error } = await supabase
    .from('contracts')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as Contract
}

export async function deleteContract(id: string) {
  const { error } = await supabase.from('contracts').delete().eq('id', id)
  if (error) throw error
}

export async function duplicateContract(id: string) {
  const original = await getContract(id)
  const year = new Date().getFullYear()
  const nextNo = await getNextContractNumber(year)
  const contractNo = `HD/VIM/${year}/${String(nextNo).padStart(3, '0')}`

  const { id: _id, created_at: _ca, updated_at: _ua, ...rest } = original
  return addContract({
    ...rest,
    contract_no: contractNo,
    year,
    status: 'draft',
  })
}

export async function getNextContractNumber(year: number): Promise<number> {
  const { data, error } = await supabase.rpc('get_next_contract_number', {
    p_year: year,
  })
  if (error) throw error
  return data as number
}

// ============================================
// Market Visits
// ============================================

export async function getMarketVisits() {
  const { data, error } = await supabase
    .from('market_visits')
    .select('*')
    .order('visit_date', { ascending: false })
  if (error) throw error
  return data as MarketVisit[]
}

export async function getMarketVisit(id: string) {
  const { data, error } = await supabase
    .from('market_visits')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data as MarketVisit
}

export async function addMarketVisit(
  visit: Omit<MarketVisit, 'id' | 'created_at'>
) {
  const { data, error } = await supabase
    .from('market_visits')
    .insert(visit)
    .select()
    .single()
  if (error) throw error
  return data as MarketVisit
}

export async function updateMarketVisit(
  id: string,
  updates: Partial<MarketVisit>
) {
  const { data, error } = await supabase
    .from('market_visits')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as MarketVisit
}

export async function deleteMarketVisit(id: string) {
  const { error } = await supabase
    .from('market_visits')
    .delete()
    .eq('id', id)
  if (error) throw error
}

export async function getMarketVisitsByDate(date: string, staffId?: string) {
  let query = supabase
    .from('market_visits')
    .select('*')
    .gte('visit_date', `${date}T00:00:00`)
    .lte('visit_date', `${date}T23:59:59`)
    .order('visit_date')

  if (staffId) {
    query = query.eq('staff_id', staffId)
  }

  const { data, error } = await query
  if (error) throw error
  return data as MarketVisit[]
}

export async function getMarketVisitsByCustomer(customerId: string) {
  const { data, error } = await supabase
    .from('market_visits')
    .select('*')
    .eq('customer_id', customerId)
    .order('visit_date', { ascending: false })
  if (error) throw error
  return data as MarketVisit[]
}

export async function getContractsByCustomer(customerId: string) {
  const { data, error } = await supabase
    .from('contracts')
    .select('*')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as Contract[]
}

// ============================================
// Stats (Dashboard)
// ============================================

export async function getDashboardStats() {
  const [contracts, visits, templates, customers, products] =
    await Promise.all([
      supabase.from('contracts').select('id', { count: 'exact', head: true }),
      supabase
        .from('market_visits')
        .select('id', { count: 'exact', head: true }),
      supabase
        .from('contract_templates')
        .select('id', { count: 'exact', head: true }),
      supabase.from('customers').select('id', { count: 'exact', head: true }),
      supabase.from('products').select('id', { count: 'exact', head: true }),
    ])

  return {
    contracts: contracts.count ?? 0,
    visits: visits.count ?? 0,
    templates: templates.count ?? 0,
    customers: customers.count ?? 0,
    products: products.count ?? 0,
  }
}

export async function getRecentContracts(limit = 5) {
  const { data, error } = await supabase
    .from('contracts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data as Contract[]
}

export async function getRecentVisits(limit = 5) {
  const { data, error } = await supabase
    .from('market_visits')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data as MarketVisit[]
}
