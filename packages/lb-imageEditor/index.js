// 导入组件
import imageEditor from './src/imageEditor.vue'

// 为组件提供 install 安装方法，供按需引入
imageEditor.install = function (Vue) {
  Vue.component(imageEditor.name, imageEditor)
}

// 默认导出组件
export default imageEditor
