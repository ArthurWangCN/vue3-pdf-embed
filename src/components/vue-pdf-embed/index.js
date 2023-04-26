import { getDocument } from 'pdfjs-dist/legacy/build/pdf.js';

import VuePdfEmbed from './vue-pdf-embed.vue';

VuePdfEmbed.getDocument = getDocument;

if (typeof window !== 'undefined' && window.Vue) {
  window.VuePdfEmbed = VuePdfEmbed;
}

export default VuePdfEmbed;
