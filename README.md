# lb-image-editor
[![Npm lb-image-editor](https://img.shields.io/badge/Npm-1.0.5-red.svg)](https://www.npmjs.com/package/lb-image-editor) [![Github lb-image-editor](https://img.shields.io/badge/Github-1.0.5-green.svg)](https://www.npmjs.com/package/lb-image-editor)

> 基于Vue2.x的头像编辑插件

## 安装
因为此插件依赖EXIF模块，所以需要和EXIF-JS一起安装
``` bash
$ npm install exif-js lb-image-editor -S
```
## 使用
在 `main.js` 文件中引入插件并注册

``` bash
import imageEditor from 'lb-image-editor'

Vue.use(imageEditor);
```

在项目中使用 lbImageEditor

```js
<template>
      <!--头像编辑器 开始-->
      <imageEditor
              uploadUrl="http://192.168.1.132:8080/file/upload"
              initHeadImg="https://timgsa.baidu.com/timg?image&quality=80&size=b9999_10000&sec=1565255719850&di=be94002735e1c81bd6d4757a9cf04322&imgtype=0&src=http%3A%2F%2Fb-ssl.duitang.com%2Fuploads%2Fitem%2F201811%2F04%2F20181104074412_wcelx.jpg"
              method="POST"
              :cropWidth="300"
              :cropHeight="200"
              :customClass="myClass"/>
      <!--头像编辑器 结束-->
</template>

<script>
    export default {
      data(){
        return {
          myClass:"customClass",//自定义追加样式
        }
      }
    }
</script>

<style>
    .customClass{
        width: 80px;
        height: 80px;
        border-radius: 0;
    }
</style>
```

## 特点
1. 超级简单，小白也会使用的编辑器
2. 可以触摸放大，缩小，移动等编辑形式，暂时无法实现旋转，后续版本会考虑添加旋转功能
3. 可以设置裁切大小
4. 可以设置头像形状样式

## 选项
| 选项名称 | 描述 | 数据类型 | 默认值 |
| ------ | ------ | ------ | ------ |
| uploadUrl | 上传图片的服务器地址 | String | " " |
| method | 上传方式 | String | POST |
| initHeadImg | 初始头像 | String | 空白头像占位图 |
| cropWidth | 裁切图片宽度（不可大于屏幕宽度） | Number | 260 |
| cropHeight | 裁切图片高度（不可大于屏幕高度） | Number | 260 |
| customClass | 如果需要修改原始头像组件的样式，可用该参数追加class样式 | String | null |

