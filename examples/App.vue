<template>
  <div id="app">
      <!--头像编辑器 开始-->
      <imageEditor
              fileType="blob"
              uploadUrl="http://192.168.1.132:8080/file/upload"
              method="POST"
              :cropWidth="300"
              :cropHeight="200"
              :customClass="myClass"/>
      <!--头像编辑器 结束-->
  </div>
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
        border-radius: inherit;
    }
</style>