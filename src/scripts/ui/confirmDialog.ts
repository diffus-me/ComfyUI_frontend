import { $el } from '../ui'

export class ComfyConfirmDialog {
  element: HTMLElement
  textElement: HTMLElement | null = null
  onOkCallback: CallableFunction | null
  onCancelCallback: CallableFunction | null
  constructor() {
    this.element = $el('div.comfy-modal', { parent: document.body }, [
      $el('div.comfy-modal-content', [
        $el('p', { $: (p) => (this.textElement = p) }),
        $el(
          'div',
          {
            style: {
              margin: '10px',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '30px'
            }
          },
          this.createButtons()
        )
      ])
    ])
    this.onOkCallback = null
    this.onCancelCallback = null
  }

  createButtons() {
    return [
      $el('button', {
        type: 'button',
        textContent: 'OK',
        onclick: () => this.onOkClicked()
      }),
      $el('button', {
        type: 'button',
        textContent: 'Cancel',
        onclick: () => this.onCancelClicked()
      })
    ]
  }

  close() {
    this.element.style.display = 'none'
    this.onOkCallback = null
    this.onCancelCallback = null
  }

  onOkClicked() {
    if (this.onOkCallback) {
      this.onOkCallback()
    }
  }

  onCancelClicked() {
    if (this.onCancelCallback) {
      this.onCancelCallback()
    }
  }

  show(html: string, onOK: CallableFunction, onCancel: CallableFunction) {
    if (this.textElement != null) {
      if (typeof html === 'string') {
        this.textElement.innerHTML = html
      } else {
        this.textElement.replaceChildren(html)
      }
    }
    this.element.style.display = 'flex'
    this.onOkCallback = onOK
    this.onCancelCallback = onCancel
  }
}
