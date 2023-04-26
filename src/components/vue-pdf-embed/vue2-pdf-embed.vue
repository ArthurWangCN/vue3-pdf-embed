<template>
  <div :id="id" ref="pdfEmbed" class="vue-pdf-embed">
    <div v-for="pageNum in pageNums" :id="id && `${id}-${pageNum}`" :key="pageNum">
      <canvas />

      <div v-if="!disableTextLayer" class="textLayer" />

      <div v-if="!disableAnnotationLayer" class="annotationLayer" />
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, toRaw, watch } from 'vue';
import * as pdf from 'pdfjs-dist';
import { PDFLinkService } from 'pdfjs-dist/legacy/web/pdf_viewer.js';

import { emptyElement, releaseChildCanvases } from './util.js';
pdf.GlobalWorkerOptions.workerSrc = 'https://cdn.bootcdn.net/ajax/libs/pdf.js/2.16.105/pdf.worker.js';

const pdfEmbed = ref(null);

const props = defineProps({
  /**
   * Whether the annotation layer should be disabled.
   * @values Boolean
   */
  disableAnnotationLayer: {
    type: Boolean,
    default: true,
  },
  /**
   * Whether the text layer should be disabled.
   * @values Boolean
   */
  disableTextLayer: Boolean,
  /**
   * Desired page height.
   * @values Number, String
   */
  height: {
    type: [Number, String],
    default: 0,
  },
  /**
   * Component identifier (inherited by page containers with page number
   * postfixes).
   * @values String
   */
  id: {
    type: String,
    default: '',
  },
  /**
   * Path for annotation icons, including trailing slash.
   * @values String
   */
  imageResourcesPath: {
    type: String,
    default: '',
  },
  /**
   * Number of the page to display.
   * @values Number
   */
  page: {
    type: Number,
    default: 0,
  },
  /**
   * Desired page rotation angle.
   * @values Number, String
   */
  rotation: {
    type: [Number, String],
    validator(value) {
      if (value % 90 !== 0) {
        throw new Error('Rotation must be 0 or a multiple of 90.');
      }
      return true;
    },
    default: 0,
  },
  /**
   * Desired ratio of canvas size to document size.
   * @values Number
   */
  scale: {
    type: Number,
    default: 0,
  },
  /**
   * Source of the document to display.
   * @values Object, String, URL, TypedArray
   */
  source: {
    type: [Object, String, URL, Uint8Array],
    required: true,
  },
  /**
   * Desired page width.
   * @values Number, String
   */
  width: {
    type: [Number, String],
    default: 0,
  },
});

const emits = defineEmits([
  'loaded',
  'rendered',
  'internal-link-clicked',
  'progress',
  'password-requested',
  'loading-failed',
  'rendering-failed',
  'printing-failed',
]);

const pdfDocument = ref(null);
const pageCount = ref(null);
const pageNums = ref([]);

// 处理PDF文档中链接
const linkService = computed(() => {
  if (!pdfDocument.value || props.disableAnnotationLayer) {
    return null;
  }

  const service = new PDFLinkService();
  service.setDocument(pdfDocument.value);
  service.setViewer({
    scrollPageIntoView: ({ pageNumber }) => {
      emits('internal-link-clicked', pageNumber);
    },
  });
  return service;
});

watch(
  () => [
    props.source,
    props.disableAnnotationLayer,
    props.disableTextLayer,
    props.height,
    props.page,
    props.rotation,
    props.width,
  ],
  async ([newSource], [oldSource]) => {
    if (newSource !== oldSource) {
      if (pdfEmbed.value) releaseChildCanvases(pdfEmbed.value);
      await load();
    }
    render();
  },
);

/**
 * Returns an array of the actual page width and height based on props and
 * aspect ratio.
 * @param {number} ratio - Page aspect ratio.
 */
const getPageDimensions = ratio => {
  let width, height;

  if (props.height && !props.width) {
    height = props.height;
    width = height / ratio;
  } else {
    width = props.width || pdfEmbed.value?.clientWidth;
    height = width * ratio;
  }

  return [width, height];
};

/**
 * Loads a PDF document. Defines a password callback for protected
 * documents.
 *
 * NOTE: Ignored if source property is not provided.
 */
const load = async () => {
  if (!props.source) {
    return;
  }

  try {
    if (props.source._pdfInfo) {
      pdfDocument.value = props.source;
    } else {
      const documentLoadingTask = pdf.getDocument(props.source);
      documentLoadingTask.onProgress = progressParams => {
        emits('progress', progressParams);
      };
      documentLoadingTask.onPassword = (callback, reason) => {
        const retry = reason === pdf.PasswordResponses.INCORRECT_PASSWORD;
        emits('password-requested', callback, retry);
      };
      pdfDocument.value = await documentLoadingTask.promise;
    }
    pageCount.value = pdfDocument.value?.numPages;
    emits('loaded', pdfDocument.value);
  } catch (e) {
    pdfDocument.value = null;
    pageCount.value = null;
    pageNums.value = [];
    emits('loading-failed', e);
  }
};

/**
 * Renders the PDF document as SVG element(s) and additional layers.
 *
 * NOTE: Ignored if the document is not loaded.
 */
const render = async () => {
  if (!pdfDocument.value) {
    return;
  }

  try {
    pageNums.value = props.page ? [props.page] : [...Array(pdfDocument.value.numPages + 1).keys()].slice(1);
    await Promise.all(
      pageNums.value.map(async (pageNum, i) => {
        const page = await toRaw(pdfDocument.value).getPage(pageNum);
        const [canvas, div1, div2] = pdfEmbed.value.children[i].children;
        const [actualWidth, actualHeight] = getPageDimensions(page.view[3] / page.view[2]);
        if ((Number(props.rotation) / 90) % 2) {
          canvas.style.width = `${Math.floor(actualHeight)}px`;
          canvas.style.height = `${Math.floor(actualWidth)}px`;
        } else {
          canvas.style.width = `${Math.floor(actualWidth)}px`;
          canvas.style.height = `${Math.floor(actualHeight)}px`;
        }

        await renderPage(page, canvas, actualWidth);

        if (!props.disableTextLayer) {
          await renderPageTextLayer(page, div1, actualWidth);
        }

        if (!props.disableAnnotationLayer) {
          await renderPageAnnotationLayer(page, div2 || div1, actualWidth);
        }
      }),
    );

    emits('rendered');
  } catch (e) {
    console.error(e);
    pdfDocument.value = null;
    pageCount.value = null;
    pageNums.value = [];
    emits('rendering-failed', e);
  }
};

/**
 * Renders the page content.
 * @param {PDFPageProxy} page - Page proxy.
 * @param {HTMLCanvasElement} canvas - HTML canvas.
 * @param {number} width - Actual page width.
 */
const renderPage = async (page, canvas, width) => {
  const num = Number(Math.ceil(width / page.view[2])) + 1;
  const viewport = page.getViewport({
    scale: props.scale * 1 || num,
    rotation: props.rotation,
  });

  canvas.width = viewport.width;
  canvas.height = viewport.height;

  await page.render({
    canvasContext: canvas.getContext('2d'),
    viewport,
  }).promise;
};

/**
 * Renders the annotation layer for the specified page.
 * @param {PDFPageProxy} page - Page proxy.
 * @param {HTMLElement} container - HTML container.
 * @param {number} width - Actual page width.
 */
const renderPageAnnotationLayer = async (page, container, width) => {
  emptyElement(container);
  pdf.AnnotationLayer.render({
    annotations: await page.getAnnotations(),
    div: container,
    linkService: linkService.value,
    page,
    renderInteractiveForms: false,
    viewport: page
      .getViewport({
        scale: width / page.view[2],
        rotation: props.rotation,
      })
      .clone({
        dontFlip: true,
      }),
    imageResourcesPath: props.imageResourcesPath,
  });
};

/**
 * Renders the text layer for the specified page.
 * @param {PDFPageProxy} page - Page proxy.
 * @param {HTMLElement} container - HTML container.
 * @param {number} width - Actual page width.
 */
const renderPageTextLayer = async (page, container, width) => {
  emptyElement(container);
  await pdf.renderTextLayer({
    container,
    textContent: await page.getTextContent(),
    viewport: page.getViewport({
      scale: width / page.view[2],
      rotation: props.rotation,
    }),
  }).promise;
};

onMounted(async () => {
  await load();
  render();
});

onBeforeUnmount(() => {
  releaseChildCanvases(pdfEmbed.value);
  toRaw(pdfDocument.value)?.destroy();
});

defineExpose({ render });
</script>

<style>
@import 'styles/text-layer';
@import 'styles/annotation-layer';
.vue-pdf-embed > div {
    position: relative;
  }
.vue-pdf-embed canvas {
    display: block;
  }
</style>
