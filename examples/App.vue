<template>
  <div id="app">
      <!--头像编辑器 开始-->
      <imageEditor
              uploadUrl="http://192.168.1.132:8080/file/upload"
              initHeadImg="https://timgsa.baidu.com/timg?image&quality=80&size=b9999_10000&sec=1565255719850&di=be94002735e1c81bd6d4757a9cf04322&imgtype=0&src=http%3A%2F%2Fb-ssl.duitang.com%2Fuploads%2Fitem%2F201811%2F04%2F20181104074412_wcelx.jpg"
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