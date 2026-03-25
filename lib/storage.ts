import { supabase } from './supabase'

const VISIT_PHOTOS_BUCKET = 'visit-photos'

export async function uploadVisitPhoto(
  file: File,
  visitId: string
): Promise<string> {
  const fileExt = file.name.split('.').pop()
  const fileName = `${visitId}/${Date.now()}.${fileExt}`

  const { error } = await supabase.storage
    .from(VISIT_PHOTOS_BUCKET)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) throw error

  const { data } = supabase.storage
    .from(VISIT_PHOTOS_BUCKET)
    .getPublicUrl(fileName)

  return data.publicUrl
}

export async function uploadMultiplePhotos(
  files: File[],
  visitId: string
): Promise<string[]> {
  const urls = await Promise.all(
    files.map((file) => uploadVisitPhoto(file, visitId))
  )
  return urls
}

export async function deleteVisitPhotos(visitId: string): Promise<void> {
  const { data: files } = await supabase.storage
    .from(VISIT_PHOTOS_BUCKET)
    .list(visitId)

  if (files && files.length > 0) {
    const paths = files.map((f) => `${visitId}/${f.name}`)
    await supabase.storage.from(VISIT_PHOTOS_BUCKET).remove(paths)
  }
}
