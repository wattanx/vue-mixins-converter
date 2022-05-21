<script lang="ts" setup>
import { toRefs } from 'vue';

type Props = {
  output: string;
};

const props = defineProps<Props>();
const { output } = toRefs(props);
</script>

<template>
  <pre
    class="hljs text-md w-full flex-1 select-all whitespace-pre-wrap border p-2 leading-5"
    v-html="output"
  ></pre>
</template>
