<script setup lang="ts">
import { ref } from 'vue'
import ConfigPanel from './components/ConfigPanel.vue'
import DebugPanel from './components/DebugPanel.vue'
import PlaygroundEditor from './components/PlaygroundEditor.vue'
import PlaygroundPreview from './components/PlaygroundPreview.vue'

const showConfig = ref(false)
const showDebug = ref(false)
const mockMode = ref(true)
const activeExample = ref('basic')

const examples = [
  { id: 'basic', name: 'Basic Signing' },
  { id: 'certificates', name: 'Certificate List' },
  { id: 'error-handling', name: 'Error Handling' },
  { id: 'hardware', name: 'Hardware Tokens' },
]
</script>

<template>
  <div class="playground">
    <!-- Header -->
    <header class="header">
      <div class="header-left">
        <h1>E-IMZO Playground</h1>
        <span class="badge" :class="{ mock: mockMode }">
          {{ mockMode ? "Mock Mode" : "Live Mode" }}
        </span>
      </div>
      <div class="header-right">
        <button :class="{ active: showConfig }" @click="showConfig = !showConfig">
          Config
        </button>
        <button :class="{ active: showDebug }" @click="showDebug = !showDebug">
          Debug
        </button>
        <a
          href="https://github.com/sanjarbarakayev/eimzo"
          target="_blank"
          class="github-link"
        >
          GitHub
        </a>
      </div>
    </header>

    <!-- Main Content -->
    <div class="main">
      <!-- Sidebar -->
      <aside class="sidebar">
        <h3>Examples</h3>
        <nav class="examples-nav">
          <button
            v-for="example in examples"
            :key="example.id"
            :class="{ active: activeExample === example.id }"
            @click="activeExample = example.id"
          >
            {{ example.name }}
          </button>
        </nav>

        <div class="mode-toggle">
          <label>
            <input v-model="mockMode" type="checkbox">
            Mock Mode
          </label>
          <p class="mode-description">
            {{
              mockMode
                ? "Using mock certificates (no E-IMZO needed)"
                : "Connecting to real E-IMZO desktop app"
            }}
          </p>
        </div>
      </aside>

      <!-- Editor + Preview -->
      <div class="workspace">
        <div class="panels">
          <div class="editor-panel">
            <PlaygroundEditor :example="activeExample" />
          </div>
          <div class="preview-panel">
            <PlaygroundPreview :example="activeExample" :mock-mode="mockMode" />
          </div>
        </div>

        <!-- Config Panel (slide in) -->
        <ConfigPanel v-if="showConfig" @close="showConfig = false" />

        <!-- Debug Panel (slide in) -->
        <DebugPanel v-if="showDebug" @close="showDebug = false" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.playground {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #1e1e1e;
  color: #d4d4d4;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background: #252526;
  border-bottom: 1px solid #3c3c3c;
}

.header h1 {
  font-size: 18px;
  font-weight: 600;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.badge {
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 4px;
  background: #3c3c3c;
}

.badge.mock {
  background: #3b82f6;
  color: white;
}

.header-right {
  display: flex;
  gap: 8px;
}

.header-right button {
  padding: 6px 12px;
  background: #3c3c3c;
  border: none;
  border-radius: 4px;
  color: #d4d4d4;
  cursor: pointer;
}

.header-right button:hover {
  background: #4c4c4c;
}

.header-right button.active {
  background: #0e639c;
}

.github-link {
  padding: 6px 12px;
  background: #3c3c3c;
  border-radius: 4px;
  color: #d4d4d4;
  text-decoration: none;
}

.github-link:hover {
  background: #4c4c4c;
}

.main {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.sidebar {
  width: 200px;
  background: #252526;
  border-right: 1px solid #3c3c3c;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.sidebar h3 {
  font-size: 12px;
  text-transform: uppercase;
  color: #858585;
  margin-bottom: 8px;
}

.examples-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.examples-nav button {
  text-align: left;
  padding: 8px 12px;
  background: transparent;
  border: none;
  border-radius: 4px;
  color: #d4d4d4;
  cursor: pointer;
}

.examples-nav button:hover {
  background: #3c3c3c;
}

.examples-nav button.active {
  background: #094771;
}

.mode-toggle {
  margin-top: auto;
  padding: 12px;
  background: #2d2d2d;
  border-radius: 6px;
}

.mode-toggle label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.mode-description {
  font-size: 11px;
  color: #858585;
  margin-top: 8px;
}

.workspace {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
}

.panels {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.editor-panel,
.preview-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.editor-panel {
  border-right: 1px solid #3c3c3c;
}
</style>
