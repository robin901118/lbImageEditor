<template>
  <div id="app">

      <input type="file"
             id="headFile"
             @change="editorImage"
             accept="image/*"
             ref="file"/>
      <label class="headImg"
             :style="{backgroundImage:'url('+cropImgSrc+')'}"
             for="headFile"></label>

      <!--头像编辑器 开始-->
      <imageEditor v-if="headImage"
                   :imageFile="headImage"
                   v-on:editorResult="editorResult($event)" />
      <!--头像编辑器 结束-->
  </div>
</template>

<script>
export default {
  data() {
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

<style>
input{display: none;}
.headImg{
    height: 70px;
    width: 70px;
    display: block;
    border-radius: 50%;
    background-color: gray;
    background-size: cover;
    background-repeat: no-repeat;
    background-position: center center;
}
</style>
  