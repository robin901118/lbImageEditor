<template lang="html">
    <div class="LBIMGEDITOR-screenBox">
        <div class="LBIMGEDITOR-editorBox">
            <!--主编辑器canvas-->
            <canvas id="LBIMGEDITOR_canvas" :width="windowWidth" :height="windowHeight"></canvas>
            <!--蒙层canvas-->
            <canvas id="LBIMGEDITOR_canvasMask" :width="windowWidth" :height="windowHeight"></canvas>
            <!--用于导出图片的canvas-->
            <canvas id="LBIMGEDITOR_resultImg" width="260" height="260" style="display: none"></canvas>
        </div>
        <div class="LBIMGEDITOR-bottomBar">
            <button type="button" @click="cancelEditor">取消</button>
            <button type="button" @click="confirmImage">完成</button>
        </div>
        <div class="LBIMGEDITOR-myMask" v-if="editorLoadingShow">
            <div class="spring-spinner">
                <div class="spring-spinner-part top">
                    <div class="spring-spinner-rotator"></div>
                </div>
                <div class="spring-spinner-part bottom">
                    <div class="spring-spinner-rotator"></div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
  require('./hammer.min');//引入hammerJS
  import EXIF from 'exif-js';

  export default {
    name: "imageEditor",
    props: ['imageFile'],
    data() {
      return {
        editorLoadingShow:true,//显示loading
        imageBase64:'',//图片的base64值
        degree: 0,//原图片旋转角度
        windowWidth: 0,//屏幕的宽度
        windowHeight: 0,//屏幕的高度
        imgEl: null,
        imgWidth: 0,//图片的宽度
        imgHeight: 0,//图片的高度
        transWidth: 0,//改变后的图片宽度
        transHeight: 0,//改变后的图片高度
        initScale: 0,
        transformScale: 1,//初始缩放
        prevX: 0,//上一次的X轴
        prevY: 0,//上一次的Y轴
        translateX: 0,//平移X轴
        translateY: 0,//平移Y轴
        canvas: null,//canvas
        canvasMask: null,//canvas-mask
        canvasResult: null//裁切图片canvas
      }
    },

    methods: {
      /**
       * 编辑之前做一些操作
       * */
      beforeEditor(){
        let files = this.imageFile,
          self = this;

        /*用EXIF获取图片元信息*/
        EXIF.getData(files, function () {
          self.orientation = EXIF.getTag(this, 'Orientation');
        });

        let fr = new FileReader();

        // 监听reader对象的的onload事件，当图片加载完成时，把base64编码賦值给预览图片
        fr.addEventListener("load", () => {
          if (this.orientation) {
            /*需要对ios做一下兼容*/
            this.getImgData(fr.result, this.orientation, data => {
              this.imageBase64 = data;
              this.createCanvas();//初始化canvas
            });
          } else {
            this.imageBase64 = fr.result;
            this.createCanvas();//初始化canvas
          }
        }, false);
        fr.readAsDataURL(files);
      },

      /**
       * +++++++++++++++++++++++++++++++++++++
       * 初始化canvas
       * +++++++++++++++++++++++++++++++++++++
       * */
      createCanvas() {
        let canvas = document.querySelector('#LBIMGEDITOR_canvas'),
          canvasMask = document.querySelector('#LBIMGEDITOR_canvasMask'),
          canvasRsut = document.querySelector('#LBIMGEDITOR_resultImg');
        this.canvas = canvas.getContext('2d');
        this.canvasMask = canvasMask.getContext('2d');
        this.canvasResult = canvasRsut.getContext('2d');
        this.windowWidth = window.innerWidth;
        this.windowHeight = window.innerHeight - 50;//减去底部的50菜单栏高度

        //清除一下canvas
        this.canvas.clearRect(0 - this.windowWidth / 2, 0 - this.windowHeight / 2, this.windowWidth, this.windowHeight);

        this.imgEl = new Image();
        this.imgEl.src = this.imageBase64;//从props中取出base64

        this.imgEl.onload = () => {
          this.imgWidth = this.imgEl.width;//初始化图片的宽
          this.imgHeight = this.imgEl.height;//初始化图片的高

          // 画蒙层
          this.canvasMask.globalCompositeOperation = 'source-out';
          this.canvasMask.fillStyle = 'rgb(255,255,255)';
          this.canvasMask.fillRect(
            this.windowWidth / 2 - 130,
            this.windowHeight / 2 - 130,
            260,
            260);
          this.canvasMask.fill();
          this.canvasMask.fillStyle = 'rgba(0,0,0,0.7)';
          this.canvasMask.fillRect(0, 0, this.windowWidth, this.windowHeight);

          // 当图片比canvas小时不做任何改变
          if (this.imgEl.width < this.windowWidth && this.imgEl.height < this.windowHeight) {
            this.imgWidth = this.imgEl.width;
            this.imgHeight = this.imgEl.height;
          } else {
            //原图片宽高比例 大于 图片框宽高比例
            if (1 <= this.imgEl.width / this.imgEl.height) {
              this.imgWidth = this.windowWidth;   //以框的宽度为标准
              this.imgHeight = this.windowWidth * (this.imgEl.height / this.imgEl.width);
            } else {   //原图片宽高比例 小于 图片框宽高比例

              this.imgWidth = this.windowHeight * (this.imgEl.width / this.imgEl.height);
              this.imgHeight = this.windowHeight;   //以框的高度为标准
            }
          }

          this.canvas.translate(this.windowWidth / 2, this.windowHeight / 2);//把canvas原点移动到中心位置
          this.canvas.drawImage(this.imgEl, 0 - this.imgWidth / 2, 0 - this.imgHeight / 2, this.imgWidth, this.imgHeight);

          /*初始化hammer*/
          this.initHammer();
        }
      },

      /**
       * +++++++++++++++++++++++++++++++++++++
       * 初始化hammer
       * +++++++++++++++++++++++++++++++++++++
       * */
      initHammer() {
        let hammer = new Hammer(document.querySelector('#LBIMGEDITOR_canvasMask'));
        hammer.get('pinch').set({enable: true});

        /*缩放 */
        hammer.on('pinchmove pinchstart pinchin pinchout', e => {
          if (e.type === "pinchstart") {
            this.initScale = this.transformScale || 1;
          }
          this.transformScale = this.initScale * e.scale;
          this.canvas.clearRect(0 - this.windowWidth / 2, 0 - this.windowHeight / 2, this.windowWidth, this.windowHeight);
          this.transWidth = this.imgWidth * this.transformScale;
          this.transHeight = this.imgHeight * this.transformScale;
          this.canvas.drawImage(this.imgEl, this.translateX - this.transWidth / 2, this.translateY - this.transHeight / 2, this.transWidth, this.transHeight);
        });

        /*平移*/
        hammer.on('panstart panmove', e => {
          if (e.type === 'panstart') {
            this.prevX = this.translateX;
            this.prevY = this.translateY;
          }
          this.translateX = this.prevX + e.deltaX;
          this.translateY = this.prevY + e.deltaY;

          /*擦除canvas*/
          this.canvas.clearRect(0 - this.windowWidth / 2, 0 - this.windowHeight / 2, this.windowWidth, this.windowHeight);
          this.canvas.drawImage(this.imgEl, this.translateX - (this.transWidth || this.imgWidth) / 2, this.translateY - (this.transHeight || this.imgHeight) / 2, this.transWidth || this.imgWidth, this.transHeight || this.imgHeight);
        });
      },

      /**
       * +++++++++++++++++++++++++++++++++++++
       * @param {string} img 图片的base64
       * @param {int} dir exif获取的方向信息
       * @param {function} next 回调方法，返回校正方向后的base64
       * +++++++++++++++++++++++++++++++++++++
       * */
      getImgData(img, dir, next) {
        let image = new Image();
        image.src = img;

        image.onload = function () {
          let degree = 0, drawWidth, drawHeight, width, height;
          drawWidth = image.naturalWidth;//暂存图片的宽
          drawHeight = image.naturalHeight;//暂存图片的高

          //以下改变一下图片大小
          let maxSide = Math.max(drawWidth, drawHeight);
          if (maxSide > 2048) {
            let minSide = Math.min(drawWidth, drawHeight);
            minSide = minSide / maxSide * 2048;
            maxSide = 2048;
            if (drawWidth > drawHeight) {
              drawWidth = maxSide;
              drawHeight = minSide;
            } else {
              drawWidth = minSide;
              drawHeight = maxSide;
            }
          }

          let canvas = document.createElement('canvas');
          canvas.width = width = drawWidth;
          canvas.height = height = drawHeight;
          let context = canvas.getContext('2d');
          //判断图片方向，重置canvas大小，确定旋转角度，iphone默认的是home键在右方的横屏拍摄方式
          switch (dir) {
            //iphone横屏拍摄，此时home键在左侧
            case 3:
              degree = 180;
              drawWidth = -width;
              drawHeight = -height;
              break;

            //iphone竖屏拍摄，此时home键在下方(正常拿手机的方向)
            case 6:
              canvas.width = height;
              canvas.height = width;
              degree = 90;
              drawWidth = width;
              drawHeight = -height;
              break;

            //iphone竖屏拍摄，此时home键在上方
            case 8:
              canvas.width = height;
              canvas.height = width;
              degree = 270;
              drawWidth = -width;
              drawHeight = height;
              break;
          }

          //使用canvas旋转校正
          context.rotate(degree * Math.PI / 180);
          context.drawImage(this, 0, 0, drawWidth, drawHeight);

          //返回校正图片
          next(canvas.toDataURL("image/jpeg"));
        }
      },

      /**
       * +++++++++++++++++++++++++++++++++++++
       * 取消编辑
       * +++++++++++++++++++++++++++++++++++++
       * */
      cancelEditor() {
        this.$emit('editorResult','');
      },

      /**
       * +++++++++++++++++++++++++++++++++++++
       * 编辑完成
       * +++++++++++++++++++++++++++++++++++++
       * */
      confirmImage(){
        let base64 = document.querySelector('#LBIMGEDITOR_canvas').toDataURL("image/png");
        let nImg = new Image();
        nImg.src = base64;
        nImg.onload = () => {
          this.canvasResult.fillStyle = 'white';
          this.canvasResult.fillRect(0, 0, 260, 260);
          this.canvasResult.drawImage(nImg, -(this.windowWidth / 2 - 130), -(this.windowHeight / 2 - 130));
          /*最后导出裁切好的图片base64码*/
          this.$emit('editorResult',document.querySelector('#LBIMGEDITOR_resultImg').toDataURL("image/jpeg"));
        }
      }
    },

    mounted() {
      //因为安卓手机调用摄像头拍照会有一个旋转屏幕的效果，
      //为了保证编辑界面不出现bug，建议加个loading延迟一下
      setTimeout(()=>{
        this.beforeEditor();
        this.editorLoadingShow = false;
      },2000);

    }
  }
</script>

<style scoped>
    .LBIMGEDITOR-screenBox {
        background: #383434;
        position: fixed;
        left: 0;
        top: 0;
        right: 0;
        bottom:0;
        z-index: 2;
        color: white;
    }

    #LBIMGEDITOR_canvasMask {
        position: absolute;
        left: 0;
        top: 0;
        z-index: 5;
    }

    .LBIMGEDITOR-editorBox {
        height: 100%;
        position: relative;
    }

    .LBIMGEDITOR-bottomBar {
        height: 50px;
        padding: 0 20px;
        border-top: 1px solid gray;
        position: fixed;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 10;
        display: flex;
        display: -webkit-box;
        display: -webkit-flex;
        justify-content: space-between;
        align-items: center;
    }

    .LBIMGEDITOR-bottomBar > button {
        background: transparent;
        color: white;
        font-size: 20px;
        border: none;
        outline: none;
    }

    .LBIMGEDITOR-myMask{
        position: fixed;
        left: 0;
        top:0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,.5);
        z-index: 9999;
        display: flex;
        display: -webkit-box;
        display: -webkit-flex;
        align-items: center;
        justify-content: center;
    }

    .spring-spinner, .spring-spinner * {
        box-sizing: border-box;
    }

    .spring-spinner {
        height: 60px;
        width: 60px;
    }

    .spring-spinner .spring-spinner-part {
        overflow: hidden;
        height: calc(60px / 2);
        width: 60px;
    }

    .spring-spinner  .spring-spinner-part.bottom {
        transform: rotate(180deg) scale(-1, 1);
    }

    .spring-spinner .spring-spinner-rotator {
        width: 60px;
        height: 60px;
        border: calc(60px / 7) solid transparent;
        border-right-color: white;
        border-top-color: white;
        border-radius: 50%;
        box-sizing: border-box;
        animation: spring-spinner-animation 3s ease-in-out infinite;
        transform: rotate(-200deg);
    }

    @keyframes spring-spinner-animation {
        0% {
            border-width: calc(60px / 7);
        }
        25% {
            border-width: calc(60px / 23.33);
        }
        50% {
            transform: rotate(115deg);
            border-width: calc(60px / 7);
        }
        75% {
            border-width: calc(60px / 23.33);
        }
        100% {
            border-width: calc(60px / 7);
        }
    }
</style>
  