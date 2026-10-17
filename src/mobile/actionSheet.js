import { createApp, h, ref } from 'vue'
import { ActionSheet } from 'vant'
import { pushOverlay } from './native'

/**
 * Funksiya ko'rinishidagi tanlov oynasi (Vant 4'da bunday API yo'q).
 * Tanlangan amalni qaytaradi; bekor qilinsa — reject('cancel').
 * actions: [{ name, key, color?, subname? }]
 */
export function showActionSheet({ title, actions, cancelText, description }) {
  return new Promise((resolve, reject) => {
    const show = ref(true)
    const host = document.createElement('div')
    document.body.appendChild(host)
    let picked = null
    const release = pushOverlay(() => (show.value = false))

    const app = createApp({
      render: () =>
        h(ActionSheet, {
          show: show.value,
          'onUpdate:show': (v) => (show.value = v),
          title,
          description,
          actions,
          cancelText,
          closeOnClickAction: true,
          closeOnPopstate: false,
          round: true,
          onSelect: (action) => {
            picked = action
          },
          onClosed: () => {
            release()
            app.unmount()
            host.remove()
            if (picked) resolve(picked)
            else reject('cancel')
          },
        }),
    })
    app.mount(host)
  })
}
