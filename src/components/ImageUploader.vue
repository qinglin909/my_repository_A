<!-- src/components/ImageUploader.vue -->
<template>
  <div class="uploader-wrapper">
    <!-- 隐藏的 input，供外部调用 -->
    <input 
      type="file" 
      ref="fileInput" 
      accept="image/*" 
      style="display: none" 
      @change="onFileChange"
    />
    
    <!-- 裁剪弹窗 -->
    <div class="crop-modal" v-if="showCropModal">
      <div class="crop-container">
        <div class="crop-header">
          <span>裁剪图片</span>
          <span class="close-btn" @click="cancelCrop">✕</span>
        </div>
        <div class="crop-body">
          <VueCropper
            ref="cropperRef"
            :img="cropImageUrl"
            :autoCrop="true"
            :autoCropWidth="300"
            :autoCropHeight="300"
            :fixedBox="true"
            outputType="jpeg"
          ></VueCropper>
        </div>
        <div class="crop-footer">
          <button class="btn-cancel" @click="cancelCrop">取消</button>
          <button class="btn-confirm" :disabled="uploading" @click="confirmCrop">
            {{ uploading ? '上传中...' : '确认并上传' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { VueCropper } from 'vue-cropper'
import 'vue-cropper/dist/index.css'
// 假设你已经在这里配置好了 supabase
import { supabase } from '@/utils/supabase' 

const emit = defineEmits(['success'])

const fileInput = ref(null)
const showCropModal = ref(false)
const cropImageUrl = ref('')
const cropperRef = ref(null)
const uploading = ref(false)

// 暴露给父组件的方法：触发文件选择
const triggerUpload = () => {
  fileInput.value.click()
}
defineExpose({ triggerUpload })

const onFileChange = (e) => {
  const file = e.target.files[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      cropImageUrl.value = e.target.result
      showCropModal.value = true
    }
    reader.readAsDataURL(file)
  }
  e.target.value = ''
}

const cancelCrop = () => {
  showCropModal.value = false
  cropImageUrl.value = ''
}

const confirmCrop = () => {
  if (!cropperRef.value) return
  uploading.value = true
  
  cropperRef.value.getCropBlob(async (blob) => {
    try {
      const fileName = `avatar_${Date.now()}.jpg`
      // 上传到 Supabase
      const { error } = await supabase.storage
        .from('avatars')
        .upload(fileName, blob, { contentType: 'image/jpeg' })
      if (error) throw error
      
      // 获取 URL
      const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(fileName)
      
      // 通知父组件上传成功，传回新 URL
      emit('success', publicUrlData.publicUrl)
      cancelCrop()
    } catch (err) {
      alert('上传失败')
    } finally {
      uploading.value = false
    }
  })
}
</script>

<style scoped>
/* 保持之前的弹窗样式即可，删掉 .upload-box 那些，只留 .crop-modal 及内部样式 */
.crop-modal { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.7); z-index: 9999; display: flex; justify-content: center; align-items: center; backdrop-filter: blur(4px);}
.crop-container { background: #fff; width: 90%; max-width: 500px; border-radius: 16px; overflow: hidden; }
.crop-header { display: flex; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid #eee; font-weight: bold; }
.crop-body { height: 400px; background: #333; position: relative; }
.crop-footer { display: flex; justify-content: flex-end; padding: 16px 20px; gap: 12px; }
.btn-confirm { background: #1989fa; color: #fff; border: none; padding: 8px 16px; border-radius: 6px;}
</style>