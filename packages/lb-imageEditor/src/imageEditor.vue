<template lang="html">
    <section>
        <!--头像容器-->

        <label
                :class="['LBIMGED__HEADIMG',...customClass]"
                ref="label">
            <input
                    type="file"
                    @change="editorImage"
                    accept="image/*"
                    ref="file"/>
        </label>

        <!--编辑器主体-->
        <div class="LBIMGEDITOR-screenBox" v-show="imageFile">
            <div class="LBIMGEDITOR-editorBox">
                <!--主编辑器canvas-->
                <canvas id="LBIMGEDITOR_canvas" :width="windowWidth" :height="windowHeight"></canvas>
                <!--蒙层canvas-->
                <canvas id="LBIMGEDITOR_canvasMask" :width="windowWidth" :height="windowHeight"></canvas>
            </div>
            <!--底部按钮-->
            <div class="LBIMGEDITOR-bottomBar">
                <button type="button" @click="cancelEditor">取消</button>
                <button type="button" @click="confirmImage">完成</button>
            </div>
            <!--loading-->
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
    </section>
</template>

<script>
  require('./hammer.min');//引入hammerJS
  import EXIF from 'exif-js';


  export default {
    name: "imageEditor",
    props: {
      //上传地址（必填）
      uploadUrl: {
        type: String,
        required: true
      },
      //传入的裁切宽度
      cropWidth: {
        type: Number,
        default: 260
      },
      //传入的裁切高度
      cropHeight: {
        type: Number,
        default: 260
      },
      //上传方式
      method: {
        type: String,
        default: "POST"
      },
      //头像组件自定义样式
      customClass:{
        type:String,
      }
    },
    data() {
      return {
        imageFile: undefined,//传入的图片
        editorLoadingShow: true,//显示loading
        imageBase64: '',//图片的base64值
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
        canvasMask: null//canvas-mask
      }
    },
    methods: {
      /**
       * +++++++++++++++++++++++++++++++++++++
       * 上传头像
       * +++++++++++++++++++++++++++++++++++++
       * */
      editorImage() {
        const files = this.$refs.file.files[0];
        if (!files) return;//在结束的时候清除file的value
        /*控制图片上传大小不超过1MB*/
        if (files.size > 8388608) {
          alert("图片不能超过1MB大小");
          return false;
        }
        this.imageFile = files;

        //因为安卓手机调用摄像头拍照会有一个旋转屏幕的效果，
        //为了保证编辑界面不出现bug，建议加个loading延迟一下
        setTimeout(() => {
          this.beforeEditor();
          this.editorLoadingShow = false;
        }, 2000);
      },

      /**
       * +++++++++++++++++++++++++++++++++++++
       * 裁切完成进行上传
       * @param file blob对象
       * +++++++++++++++++++++++++++++++++++++
       * */
      editorResult(file) {
        const self = this;
        //显示裁切图片
        this.$refs.label.style.backgroundImage = `url(${URL.createObjectURL(file)})`;

        //执行上传.....
        let formData = new FormData();
        formData.append('files', file, 'image.jpg');
        const xhr = new XMLHttpRequest();
        xhr.open(this.method, this.uploadUrl);
        xhr.onload = function () {
          if (xhr.status >= 200 && xhr.status < 300 || xhr.status === 304) {
            alert("上传成功");
            self.resetEditor();
          }
        };
        xhr.send(formData);
      },

      /**
       * +++++++++++++++++++++++++++++++++++++
       * 初始化图片编辑器（初始化data）
       * +++++++++++++++++++++++++++++++++++++
       * **/
      resetEditor() {
        Object.assign(this.$data, this.$options.data());
      },

      /**
       * +++++++++++++++++++++++++++++++++++++
       * 编辑之前做一些操作
       * +++++++++++++++++++++++++++++++++++++
       * */
      beforeEditor() {
        const self = this;

        /*用EXIF获取图片元信息*/
        EXIF.getData(this.imageFile, function () {
          self.orientation = EXIF.getTag(this, 'Orientation');
        });

        const fr = new FileReader();

        // 监听reader对象的的onload事件，当图片加载完成时，把base64编码賦值给预览图片
        fr.addEventListener("load", () => {
          if (this.orientation) {
            /*ios做一下兼容*/
            this.getImgData(fr.result, this.orientation, data => {
              this.imageBase64 = data;
              this.createCanvas();//初始化canvas
            });
          } else {
            this.imageBase64 = fr.result;
            this.createCanvas();//初始化canvas
          }
        }, false);
        fr.readAsDataURL(this.imageFile);
      },

      /**
       * +++++++++++++++++++++++++++++++++++++
       * 初始化canvas
       * +++++++++++++++++++++++++++++++++++++
       * */
      createCanvas() {
        let canvas = document.querySelector('#LBIMGEDITOR_canvas'),
          canvasMask = document.querySelector('#LBIMGEDITOR_canvasMask');
        this.canvas = canvas.getContext('2d');
        this.canvasMask = canvasMask.getContext('2d');
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
            this.windowWidth / 2 - this.cropWidth / 2,
            this.windowHeight / 2 - this.cropHeight / 2,
            this.cropWidth,
            this.cropHeight);
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
          this.canvas.drawImage(
            this.imgEl,
            0 - this.imgWidth / 2,
            0 - this.imgHeight / 2,
            this.imgWidth,
            this.imgHeight);

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

        //缩放
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

        //平移
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
        this.$refs.file.value = '';
        this.resetEditor();
      },

      /**
       * +++++++++++++++++++++++++++++++++++++
       * 编辑完成
       * +++++++++++++++++++++++++++++++++++++
       * */
      confirmImage() {
        let base64 = document.querySelector('#LBIMGEDITOR_canvas').toDataURL("image/png");
        let nImg = new Image();
        nImg.src = base64;
        nImg.onload = () => {
          //创建一个reasultCanvas
          let canvas = document.createElement('canvas');
          canvas.width = this.cropWidth;
          canvas.height = this.cropHeight;
          let context = canvas.getContext('2d');

          //对resultCanva做背景填充并放入图片
          context.fillStyle = 'white';
          context.fillRect(0, 0, this.cropWidth, this.cropHeight);
          context.drawImage(
            nImg,
            -(this.windowWidth / 2 - this.cropWidth / 2),
            -(this.windowHeight / 2 - this.cropHeight / 2));

          //导出裁切好的图片(blob对象)
          canvas.toBlob(blob => this.editorResult(blob), "image/jpeg", 1);
        }
      }
    },
    mounted() {
      //canvas.toBlob api polyfill
      if (!HTMLCanvasElement.prototype.toBlob) {
        Object.defineProperty(HTMLCanvasElement.prototype, 'toBlob', {
          value: function (callback, type, quality) {

            let binStr = atob(this.toDataURL(type, quality).split(',')[1]),
              len = binStr.length,
              arr = new Uint8Array(len);

            for (let i = 0; i < len; i++) {
              arr[i] = binStr.charCodeAt(i);
            }

            callback(new Blob([arr], {type: type || 'image/png'}));
          }
        });
      }
    }
  }
</script>

<style scoped>
    @import "./imageEditor.css";
</style>
  