/**
 * Fotos enviadas pela Ana no painel: reduzidas e convertidas para WebP no próprio navegador
 * e guardadas no banco como texto (data URL). Assim não precisa de servidor de arquivos.
 * Cada documento do Firestore aceita até 1 MB, então a foto fica com no máximo ~450 KB.
 */
const LIMITE = 450 * 1024

export async function comprimirFoto(arquivo, { lado = 1400 } = {}) {
  if (!arquivo?.type?.startsWith('image/')) throw new Error('Escolha um arquivo de imagem.')
  const bitmap = await createImageBitmap(arquivo, { imageOrientation: 'from-image' })
  let escala = Math.min(1, lado / Math.max(bitmap.width, bitmap.height))
  for (let tentativa = 0; tentativa < 6; tentativa++) {
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * escala)
    canvas.height = Math.round(bitmap.height * escala)
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    for (const qualidade of [0.82, 0.72, 0.6]) {
      const url = canvas.toDataURL('image/webp', qualidade)
      // navegador sem WebP devolve PNG: tenta JPEG
      const final = url.startsWith('data:image/webp') ? url : canvas.toDataURL('image/jpeg', qualidade)
      if (final.length * 0.75 <= LIMITE) return final
    }
    escala *= 0.8
  }
  throw new Error('Foto muito grande. Tente outra.')
}
