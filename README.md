# Vue Mixins Converter
Convert mixins to composables.

The core logic is based on the following repository.

https://github.com/miyaoka/vue-composition-converter

## convert options

- data, computed, watch, methods, lifecycle, props -> setup()
  - data -> ref()
  -  computed -> computed()
  - watch -> watch()
  - methods -> function
  - lifecycle -> lifecycle hooks
  - beforeCreate, created -> Immediate function
  - props -> toRefs()

> **Warning**
> 
> props do not convert.
>
> This is because props should be held on the component side.
