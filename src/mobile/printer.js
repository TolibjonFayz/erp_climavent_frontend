import { Capacitor, registerPlugin } from '@capacitor/core'
import { printDogovorDocument, buildDogovorHtml } from '@/utils/dogovorPdf'
import { shareHtml } from './exporter'

// Android: ilovaning o'z "Printer" plagini (android/.../PrinterPlugin.java) —
// tizim chop etish oynasi, u yerda "PDF sifatida saqlash" ham bor.
const Printer = registerPlugin('Printer')

/** Shartnoma hujjatini chop etish / PDF qilish */
export async function printDogovor(row) {
  const platform = Capacitor.getPlatform()
  if (platform === 'android') {
    await Printer.print({ html: buildDogovorHtml(row), name: `Dogovor_${row.dogovor_number ?? row.id}` })
  } else if (platform === 'ios') {
    // iOS WKWebView'da print() yo'q — hujjatni ulashamiz (Fayllar/Safari'da ochib chop etiladi)
    await shareHtml(`Dogovor_${row.dogovor_number ?? row.id}`, buildDogovorHtml(row))
  } else {
    await printDogovorDocument(row)
  }
}
