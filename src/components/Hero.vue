<template>
  <div>Hero</div>
</template>
<script lang="ts">
import { defineComponent } from 'vue';
import MixinSample from '../mixins/MixinSample';

export default defineComponent({
  setup() {},
  mixins: [MixinSample],
  methods: {
    getFullName(): string {
      return (this as InstanceType<typeof MixinSample>).fullName;
    },
  },
});
</script>
