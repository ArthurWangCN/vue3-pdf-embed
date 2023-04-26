<script setup>
import VuePdfEmbed from './vue-pdf-embed/vue-pdf-embed.vue';
import { ref } from 'vue'

defineProps({
  msg: String,
})

const count = ref(0)

const pdfSource = ref('https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/examples/learning/helloworld.pdf')
</script>

<template>
  <h1>pdf预览</h1>

  <vue-pdf-embed
    id="chat-pdf-embed"
    ref="pdfRef"
    :source="pdfSource"
  />

</template>

<style scoped>
#chat-pdf-embed {
  width: 50%;
}
</style>
