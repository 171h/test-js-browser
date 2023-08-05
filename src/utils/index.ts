import { isFunction } from '@171h/utils'

export function show(...values: any) {
  values.forEach((value) => {
    try {
      document.body.innerText += isFunction(value) ? `${value()} \n` : `${value} \n`
    }
    catch (e) {
      document.body.innerText += String(e)
    }
  })
}
