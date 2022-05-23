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
> If props are defined, they must be passed to 'composables'.
>
> It is also necessary to define props on the component side.