import { HotkeyCallback, Keys, OptionsOrDependencyArray, RefType } from './types'
import { useCallback, useEffect, useRef } from 'react'
import { parseHotkey, parseKeysHookInput } from './parseHotkeys'
import {
  isHotkeyEnabled,
  isHotkeyEnabledOnTag,
  isHotkeyMatchingKeyboardEvent,
  isKeyboardEventTriggeredByInput, isScopeActive,
  possiblyPreventDefault,
} from './validators'
import { useHotkeysContext } from './HotkeyProvider'

export default function useHotkeys<T extends Element>(
  keys: Keys,
  callback: HotkeyCallback,
  options?: OptionsOrDependencyArray,
  dependencies?: OptionsOrDependencyArray
) {
  const ref = useRef<RefType<T>>(null)

  const _options = !(options instanceof Array) ? options : !(dependencies instanceof Array) ? dependencies : undefined
  const _deps = options instanceof Array ? options : dependencies instanceof Array ? dependencies : []

  const cb = useCallback(callback, [..._deps])
  const ctx = useHotkeysContext()

  useEffect(() => {
    console.log('run effect')

    if (_options?.enabled === false || !isScopeActive(ctx.activeScopes, _options?.scopes)) {
      console.log('disabled')

      return
    }

    const listener = (e: KeyboardEvent) => {
      console.log('listener', e)

      if (isKeyboardEventTriggeredByInput(e) && !isHotkeyEnabledOnTag(e, _options?.enableOnTags)) {
        console.log('return because of tag')

        return
      }

      console.log('check for hotkey for input', e.key)

      parseKeysHookInput(keys, _options?.splitKey).forEach((key) => {
        const hotkey = parseHotkey(key, _options?.combinationKey)

        if (isHotkeyMatchingKeyboardEvent(e, hotkey)) {
          possiblyPreventDefault(e, hotkey, _options?.preventDefault)

          if (!isHotkeyEnabled(e, hotkey, _options?.enabled)) {
            console.log('return because of enabled')
            return
          }

          console.log('trigger callback for', key)

          cb(e, hotkey)
        } else {
          console.log('did not match key', key)
        }
      })
    }

    if (_options?.keyup) {
      console.log('add keyup listener')
      document.addEventListener('keyup', listener)
    }

    if ((_options?.keydown === undefined && _options?.keyup !== true) || _options?.keydown) {
      console.log('add keydown listener')
      document.addEventListener('keydown', listener)
    }

    return () => {
      document.removeEventListener('keydown', listener)
      document.removeEventListener('keyup', listener)
    }
  }, [keys, cb, _options])

  return ref
}
