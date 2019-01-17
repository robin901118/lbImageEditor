# lb-image-editor

[![Npm lb-image-editor](https://img.shields.io/badge/Npm-0.2.0-red.svg)](https://www.npmjs.com/package/lb-image-editor)

> 基于Vue2.x的头像编辑插件
> 源码：https://github.com/robin901118/lbImageEditor

## 安装
因为此插件需要EXIF模块，所以需要先安装EXIF-JS
``` bash
$ npm install exif-js -S
```
再安装此插件
``` bash
$ npm install lb-image-editor-S
```
## 使用
在 `main.js` 文件中引入插件并注册

``` bash
# main.js
import imageEditor from 'lb-image-editor'
Vue.use(imageEditor);
```

在项目中使用 lbImageEditor

```js
<template>
  <!--头像上传input-->
  <input type="file" id="headFile" @change="editorImage" accept="image/*" ref="file"/>

  <!--头像编辑器 开始-->
  <imageEditor v-if="headImage" :imageFile="headImage" v-on:editorResult="editorResult($event)">
  </imageEditor>
  <!--头像编辑器 结束-->
</template>
<script>
  export default {
    data () {
      return {
        orientation: null,//图片元信息
        headImage: null,
        cropImgSrc:"",//裁剪好的图片
      }
    },
    methods:{
      /**
       * 上传头像
       * */
      editorImage() {
        let files = this.$refs.file.files[0];
        if(!files) return;//在结束的时候清除file的value
        /*控制图片上传大小不超过1MB*/
        if (files.size > 8388608) {
          this.$store.commit('SET_TOAST', {show: true, txt: '图片不能超过1MB大小'});
          return false;
        }

        this.headImage = files;
      },

      /**
       * +++++++++++++++++++++++++++++++++++++
       * 编辑结束的回调
       * @param data 编辑后的base64值，如果为空则表示点击了取消
       * +++++++++++++++++++++++++++++++++++++
       * */
      editorResult(data){
        this.headImage = '';
        this.$refs.file.value = '';
        if(!data) return;//点击了取消

        //执行上传.....
        this.cropImgSrc = data;
      },
    }
  }
</script>
```

## 特点
1. 简单易用，传入图片文件即可编辑
2. 提供以 `npm` 的形式安装提供全局组件
3. 可以触摸放大，缩小，移动等编辑形式，暂时无法实现旋转，后续版本会考虑添加旋转功能

## 选项
| 选项名称 | 描述 | 数据类型 | 默认值 |
| ------ | ------ | ------ | ------ |
| imageFile | 图片文件（不可传入空文件，需要事先判断一下，不可传入太大文件，防止页面卡顿） | Object | null |
| cropWidth | 裁切图片宽度（不可大于屏幕宽度） | Number | 260 |
| cropWidth | 裁切图片宽度（不可大于屏幕宽度） | Number | 260 |

## 事件
| 事件名称 | 描述 |
| ------ | ------ |
| editorResult | 返回裁切好的图片base64（需要对返回数据做判断，为空则是点击了取消） |


``` js
editorResult(data){
        this.headImage = '';
        this.$refs.file.value = '';
        if(!data) return;//点击了取消

        //执行上传.....
        this.cropImgSrc = data;
      }
```
