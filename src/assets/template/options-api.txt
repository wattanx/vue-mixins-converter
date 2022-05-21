export default {
  name: 'MixinSample',
  props: {},
  data() {
    return {
      firstName: 'first',
      lastName: 'last',
    };
  },
  computed: {
    fullName() {
      return this.firstName + this.lastName;
    },
  },
};
