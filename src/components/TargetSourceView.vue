<script lang="ts" setup>
import { toRefs } from 'vue';

type Props = {
  input: string;
  hasError: boolean;
};

const props = defineProps<Props>();
const { input, hasError } = toRefs(props);
</script>

<template>
  <textarea
    class="text-md w-full flex-1 border p-2 leading-5"
    :class="{ hasError }"
    v-model="input"
  ></textarea>
</template>

<style scoped>
.hasError {
  @apply border-4 border-red-500 outline-none;
}
</style>
