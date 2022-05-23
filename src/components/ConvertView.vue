<script lang="ts" setup>
import { ref, watch } from 'vue';
import OutputSourceView from './OutputSourceView.vue';
import prettier from 'prettier';
import parserTypeScript from 'prettier/parser-typescript';
import hljs from 'highlight.js/lib/core';
import typescript from 'highlight.js/lib/languages/typescript';
import 'highlight.js/styles/atom-one-dark.css';
import { convertSrc } from '../lib/converter';
// @ts-ignore
import optionsApi from '../assets/template/options-api.txt?raw';
import TargetSourceView from './TargetSourceView.vue';

hljs.registerLanguage('typescript', typescript);

const outputType = new Map([
  ['vue2', 'Vue 2 / Composition API'],
  ['nuxt2', 'Nuxt 2.x / Composition API'],
]);

const outputTypeKeys = [...outputType.keys()];

const input = ref(optionsApi);
const functionName = ref('useMixinSample');
const output = ref('');
const selectedOutputType = ref(outputTypeKeys[0]);
const hasError = ref(false);

watch(
  [input, selectedOutputType],
  () => {
    const useNuxt = selectedOutputType.value === 'nuxt2';
    try {
      hasError.value = false;
      const outputText = convertSrc({
        input: input.value,
        fileName: functionName.value,
        useNuxt,
      });
      const prettifiedHtml = hljs.highlightAuto(
        prettier.format(outputText, {
          parser: 'typescript',
          plugins: [parserTypeScript],
        })
      ).value;
      output.value = prettifiedHtml;
    } catch (err) {
      hasError.value = true;
      console.error(err);
    }
  },
  { immediate: true }
);
</script>

<template>
  <div class="flex h-full flex-row">
    <div class="flex flex-1 flex-col">
      <div class="flex flex-row space-x-4 py-4">
        <h2>Input: Vue2 Mixins</h2>
        <div>
          <label for="function-name">functionName: </label>
          <input
            id="function-name"
            class="rounded-md border-1 border-solid border-borderColor px-2 outline outline-2 outline-transparent focus:outline-focused"
            type="text"
            :value="functionName"
          />
        </div>
      </div>
      <TargetSourceView :input="input" :has-error="hasError" />
    </div>
    <div class="flex flex-1 flex-col">
      <div class="flex flex-row py-4">
        <label for="output-type" class="mr-2">Output: </label>
        <select id="output-type"
          v-model="selectedOutputType"
          class="rounded-md border-1 border-solid border-borderColor outline outline-2 outline-transparent focus:outline-focused"
        >
          <option v-for="key in outputTypeKeys" :key="key">
            {{ key }}
          </option>
        </select>
      </div>

      <OutputSourceView :output="output" />
    </div>
  </div>
</template>

<style scoped>
.hasError {
  @apply border-4 border-red-500 outline-none;
}
</style>
