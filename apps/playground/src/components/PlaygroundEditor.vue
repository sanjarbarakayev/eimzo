<script setup lang="ts">
import type * as Monaco from 'monaco-editor'
import loader from '@monaco-editor/loader'
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { examples } from '../examples/index'

const props = defineProps<{
  example: string
}>()

const editorContainer = ref<HTMLDivElement | null>(null)
let editor: Monaco.editor.IStandaloneCodeEditor | null = null
let monaco: typeof Monaco | null = null

onMounted(async () => {
  monaco = await loader.init()

  if (editorContainer.value) {
    editor = monaco.editor.create(editorContainer.value, {
      value: examples[props.example] || examples.basic,
      language: 'vue',
      theme: 'vs-dark',
      minimap: { enabled: false },
      fontSize: 14,
      lineNumbers: 'on',
      scrollBeyondLastLine: false,
      automaticLayout: true,
      tabSize: 2,
      wordWrap: 'on',
    })

    // Register Vue language if not available
    monaco.languages.register({ id: 'vue' })
    monaco.languages.setMonarchTokensProvider('vue', {
      tokenizer: {
        root: [
          [/<script[^>]*>/, { token: 'tag', next: '@script' }],
          [/<template[^>]*>/, { token: 'tag', next: '@template' }],
          [/<style[^>]*>/, { token: 'tag', next: '@style' }],
        ],
        script: [
          [/<\/script>/, { token: 'tag', next: '@root' }],
          [/./, 'source.ts'],
        ],
        template: [
          [/<\/template>/, { token: 'tag', next: '@root' }],
          [/./, 'source.html'],
        ],
        style: [
          [/<\/style>/, { token: 'tag', next: '@root' }],
          [/./, 'source.css'],
        ],
      },
    })
  }
})

onUnmounted(() => {
  editor?.dispose()
})

watch(
  () => props.example,
  (newExample) => {
    if (editor) {
      editor.setValue(examples[newExample] || examples.basic)
    }
  },
)
</script>

<template>
  <div class="editor-wrapper">
    <div class="editor-header">
      <span>Code</span>
      <span class="filename">{{ example }}.vue</span>
    </div>
    <div ref="editorContainer" class="editor-container" />
  </div>
</template>

<style scoped>
.editor-wrapper {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  padding: 8px 16px;
  background: #2d2d2d;
  border-bottom: 1px solid #3c3c3c;
  font-size: 12px;
}

.filename {
  color: #858585;
}

.editor-container {
  flex: 1;
}
</style>
