# Vue 3 + Vite

This template should help get you started developing with Vue 3 in Vite. The template uses Vue 3 `<script setup>` SFCs, check out the [script setup docs](https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup) to learn more.

## 说明

由于 vue-pdf-embed 库在 vue3 项目中使用 CDN 时报错：`Uncaught TypeError: Cannot read properties of undefined (reading 'createVNode')`，且作者未给出解决方法（源码是vue2写的），所以自己封装一个基于vue3的pdf组件。

## 引入 pdf.worker.js

pdfjs-dist是一个用于在Web上显示PDF文件的JavaScript库，它是由Mozilla开发的pdf.js的一个分支。pdfjs-dist中包含了pdf.js库的完整代码，同时还提供了一些封装好的方法和工具函数，方便开发者使用。

在pdfjs-dist中，GlobalWorkerOptions.workerSrc是一个静态属性，用于指定PDFWorker的位置。PDFWorker是一个运行在Web Worker中的类，用于在后台处理PDF文档的解析和渲染等任务。为了提高应用程序的性能，pdfjs-dist使用了Web Worker来将这些耗时的任务放在后台线程中进行处理，从而避免阻塞主线程。

GlobalWorkerOptions.workerSrc属性指定了PDFWorker的代码文件所在的位置。默认情况下，它指向了pdf.js库中的pdf.worker.js文件。如果您希望使用不同的代码文件，可以在初始化pdf.js之前将GlobalWorkerOptions.workerSrc属性设置为新的代码文件路径。

```js
pdf.GlobalWorkerOptions.workerSrc = '/path/to/worker.js';
```

## PDFLinkService

pdfjs-dist中的PDFLinkService是一个用于处理PDF文档中链接的JavaScript类。PDFLinkService提供了一些方法和属性，可以让您方便地处理PDF文档中的链接，并在用户点击链接时执行相应的操作。

PDFLinkService的主要作用如下：

1. 解析PDF文档中的链接：PDFLinkService可以解析PDF文档中的所有链接，包括文本链接和区域链接。
2. 处理链接的点击事件：PDFLinkService可以在用户点击链接时执行相应的操作，例如跳转到链接指向的页面或网址。
3. 高亮显示链接：PDFLinkService可以高亮显示鼠标悬停在链接上时的链接区域，以提示用户该区域是一个链接。
4. 滚动到链接区域：PDFLinkService可以将页面滚动到包含链接的区域，以确保用户能够看到链接的内容。

在pdfjs-dist中，PDFLinkService通常与PDFViewer和PDFThumbnailViewer一起使用，以实现完整的PDF查看器功能。PDFLinkService可以在PDFViewer或PDFThumbnailViewer中注册，并通过相应的事件处理函数来处理链接的点击事件和鼠标悬停事件。

如果您正在使用pdfjs-dist开发自己的PDF查看器，可以使用PDFLinkService来方便地处理PDF文档中的链接，并为用户提供更好的交互体验。
