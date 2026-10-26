// Amal bajarilgach "Bekor qilish" tugmali qora toast (masalan, KP/vazifa boshqa bosqichga o'tganda).
// onUndo — bekor qilish amali (async bo'lishi mumkin); xato bo'lsa chaqiruvchi o'zi ko'rsatadi.
import { h } from 'vue'
import { ElMessage } from 'element-plus'

export function undoToast({ message, undoLabel, onUndo, duration = 6000 }) {
  let instance
  const run = async () => {
    instance?.close()
    await onUndo()
  }
  instance = ElMessage({
    customClass: 'undo-message',
    showClose: false,
    duration,
    grouping: true,
    message: h('div', { class: 'undo-toast' }, [
      h('span', { class: 'undo-toast__text' }, message),
      h('button', { type: 'button', class: 'undo-toast__btn', onClick: run }, undoLabel),
    ]),
  })
  return instance
}
