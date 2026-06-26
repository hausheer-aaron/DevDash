/**
 * Registers a curated set of highlight.js languages on a core instance.
 * Importing the core + explicit languages (rather than the full bundle) keeps
 * the syntax-highlighting chunk lean while covering everything offered in the
 * snippet editor (see SNIPPET_LANGUAGES).
 */
import type { HLJSApi } from 'highlight.js'

import javascript from 'highlight.js/lib/languages/javascript'
import typescript from 'highlight.js/lib/languages/typescript'
import python from 'highlight.js/lib/languages/python'
import go from 'highlight.js/lib/languages/go'
import rust from 'highlight.js/lib/languages/rust'
import java from 'highlight.js/lib/languages/java'
import kotlin from 'highlight.js/lib/languages/kotlin'
import swift from 'highlight.js/lib/languages/swift'
import ruby from 'highlight.js/lib/languages/ruby'
import php from 'highlight.js/lib/languages/php'
import c from 'highlight.js/lib/languages/c'
import cpp from 'highlight.js/lib/languages/cpp'
import csharp from 'highlight.js/lib/languages/csharp'
import sql from 'highlight.js/lib/languages/sql'
import bash from 'highlight.js/lib/languages/bash'
import shell from 'highlight.js/lib/languages/shell'
import json from 'highlight.js/lib/languages/json'
import yaml from 'highlight.js/lib/languages/yaml'
import ini from 'highlight.js/lib/languages/ini'
import xml from 'highlight.js/lib/languages/xml'
import css from 'highlight.js/lib/languages/css'
import scss from 'highlight.js/lib/languages/scss'
import graphql from 'highlight.js/lib/languages/graphql'
import dockerfile from 'highlight.js/lib/languages/dockerfile'
import markdown from 'highlight.js/lib/languages/markdown'
import plaintext from 'highlight.js/lib/languages/plaintext'

let registered = false

export function registerHljsLanguages(hljs: HLJSApi) {
  if (registered) return
  registered = true

  hljs.registerLanguage('javascript', javascript)
  hljs.registerLanguage('typescript', typescript)
  hljs.registerLanguage('jsx', javascript)
  hljs.registerLanguage('tsx', typescript)
  hljs.registerLanguage('python', python)
  hljs.registerLanguage('go', go)
  hljs.registerLanguage('rust', rust)
  hljs.registerLanguage('java', java)
  hljs.registerLanguage('kotlin', kotlin)
  hljs.registerLanguage('swift', swift)
  hljs.registerLanguage('ruby', ruby)
  hljs.registerLanguage('php', php)
  hljs.registerLanguage('c', c)
  hljs.registerLanguage('cpp', cpp)
  hljs.registerLanguage('csharp', csharp)
  hljs.registerLanguage('sql', sql)
  hljs.registerLanguage('bash', bash)
  hljs.registerLanguage('shell', shell)
  hljs.registerLanguage('json', json)
  hljs.registerLanguage('yaml', yaml)
  hljs.registerLanguage('toml', ini)
  hljs.registerLanguage('ini', ini)
  hljs.registerLanguage('html', xml)
  hljs.registerLanguage('xml', xml)
  hljs.registerLanguage('css', css)
  hljs.registerLanguage('scss', scss)
  hljs.registerLanguage('graphql', graphql)
  hljs.registerLanguage('dockerfile', dockerfile)
  hljs.registerLanguage('markdown', markdown)
  hljs.registerLanguage('plaintext', plaintext)
}
