<template>
  <div class="app-container">
    <!-- 顶部导航栏 -->
    <header class="top-header">
      <div class="header-wrapper">
        <div class="logo-section">
          <div class="logo-icon">📝</div>
          <div class="logo-text">
            <h1>AI 作业批改助手</h1>
            <p>智能批改，快速反馈</p>
          </div>
        </div>
        <el-button @click="showConfigDialog = true" class="config-btn" type="primary" plain>
          <span class="btn-icon">🔑</span>
          配置 API Key
        </el-button>
      </div>
    </header>

    <!-- 主内容区 -->
    <main class="main-wrapper">
      <div class="content-grid">
        <!-- 左侧：输入区域 -->
        <section class="input-section">
          <div class="section-header">
            <h2>📤 提交作业</h2>
            <p class="section-desc">输入作业内容或上传文件</p>
          </div>
          
          <div class="input-container">
            <el-tabs v-model="activeTab" class="custom-tabs">
              <el-tab-pane label="文本输入" name="text">
                <div class="textarea-wrapper">
                  <el-input
                    v-model="textContent"
                    type="textarea"
                    :rows="16"
                    placeholder="请输入作业内容..."
                    class="text-input"
                  />
                </div>
              </el-tab-pane>
              
              <el-tab-pane label="文件上传" name="file">
                <div class="upload-wrapper">
                  <el-upload
                    class="upload-area"
                    drag
                    :auto-upload="false"
                    :on-change="handleFileChange"
                    :file-list="fileList"
                    accept=".txt,.doc,.docx,.pdf,image/*"
                  >
                    <div class="upload-content">
                      <el-icon class="upload-icon"><upload-filled /></el-icon>
                      <p class="upload-text">将文件拖到此处，或<em>点击上传</em></p>
                      <p class="upload-hint">支持 .txt, .doc, .docx, .pdf, 图片等格式</p>
                    </div>
                  </el-upload>
                </div>
              </el-tab-pane>
            </el-tabs>

            <div class="action-bar">
              <el-button 
                type="primary" 
                @click="handleSubmit" 
                :loading="loading" 
                class="submit-btn"
                size="large"
              >
                <span v-if="!loading">✨ 开始批改</span>
                <span v-else>批改中...</span>
              </el-button>
              <el-button @click="clearContent" class="clear-btn" size="large">
                清空内容
              </el-button>
            </div>
          </div>
        </section>

        <!-- 右侧：结果区域 -->
        <section class="result-section">
          <div class="section-header">
            <h2>📊 批改结果</h2>
            <p class="section-desc">查看评分和评语</p>
          </div>
          
          <div class="result-container">
            <div v-if="!result" class="empty-state">
              <div class="empty-icon">📋</div>
              <p class="empty-text">等待提交作业</p>
              <p class="empty-hint">请在左侧输入或上传作业内容</p>
            </div>
            
            <div v-else class="result-display">
              <!-- 评分卡片 -->
              <div class="score-card">
                <div class="score-circle" :class="result.levelClass">
                  <div class="score-inner">
                    <div class="score-number">{{ result.score }}</div>
                    <div class="score-unit">分</div>
                  </div>
                </div>
                <div class="score-info">
                  <el-tag :type="result.levelTagType" class="level-tag" size="large">
                    {{ result.level }}
                  </el-tag>
                  <p class="score-desc">作业完成度评估</p>
                </div>
              </div>
              
              <!-- 评语卡片 -->
              <div class="comments-card">
                <div class="comments-header">
                  <h3>💬 批改评语</h3>
                </div>
                <div class="comments-body">
                  <p class="comments-text">{{ result.comments }}</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>

    <!-- 底部 -->
    <footer class="app-footer">
      <p>本项目由阿里云ESA提供加速、计算和保护</p>
    </footer>

    <!-- API Key 配置弹窗 -->
    <el-dialog
      v-model="showConfigDialog"
      title="配置阿里云 API Key"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="configForm" label-width="120px">
        <el-form-item label="AccessKey ID">
          <el-input
            v-model="configForm.accessKeyId"
            type="password"
            show-password
            placeholder="请输入 AccessKey ID"
          />
        </el-form-item>
        <el-form-item label="AccessKey Secret">
          <el-input
            v-model="configForm.accessKeySecret"
            type="password"
            show-password
            placeholder="请输入 AccessKey Secret"
          />
        </el-form-item>
        <el-alert
          title="安全提示"
          type="info"
          :closable="false"
          style="margin-bottom: 20px;"
        >
          <template #default>
            <div style="font-size: 12px;">
              <p>• API Key 仅存储在浏览器本地，不会上传到服务器</p>
              <p>• 请妥善保管您的 API Key，不要泄露给他人</p>
            </div>
          </template>
        </el-alert>
      </el-form>
      <template #footer>
        <el-button @click="showConfigDialog = false">取消</el-button>
        <el-button type="primary" @click="saveConfig">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { UploadFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { submitGrade as apiSubmitGrade, type GradeRequest } from './services/grader'

const activeTab = ref('text')
const textContent = ref('')
const fileList = ref<any[]>([])
const loading = ref(false)
const result = ref<any>(null)
const showConfigDialog = ref(false)
const configForm = ref({
  accessKeyId: '',
  accessKeySecret: ''
})

function handleFileChange(file: any) {
  fileList.value = [file]
}

function loadConfig() {
  const saved = localStorage.getItem('aliyun_accesskey')
  if (saved) {
    try {
      const config = JSON.parse(saved)
      configForm.value = {
        accessKeyId: config.accessKeyId || '',
        accessKeySecret: config.accessKeySecret || ''
      }
    } catch (e) {
      console.error('加载配置失败:', e)
    }
  }
}

function saveConfig() {
  if (!configForm.value.accessKeyId || !configForm.value.accessKeySecret) {
    ElMessage.warning('请填写完整的 API Key 信息')
    return
  }
  
  localStorage.setItem('aliyun_accesskey', JSON.stringify({
    accessKeyId: configForm.value.accessKeyId,
    accessKeySecret: configForm.value.accessKeySecret
  }))
  
  ElMessage.success('配置已保存')
  showConfigDialog.value = false
}

async function handleSubmit() {
  if (activeTab.value === 'text' && !textContent.value.trim()) {
    ElMessage.warning('请输入作业内容')
    return
  }
  
  if (activeTab.value === 'file' && fileList.value.length === 0) {
    ElMessage.warning('请上传作业文件')
    return
  }

  // 检查是否配置了 AccessKey（可选，如果没有配置会使用模拟模式）
  const saved = localStorage.getItem('aliyun_accesskey')
  if (!saved) {
    const confirmed = confirm('未配置 AccessKey，将使用模拟模式进行批改。是否现在配置？')
    if (confirmed) {
      showConfigDialog.value = true
      return
    }
  }

  loading.value = true
  result.value = null

  try {
    const data: GradeRequest = activeTab.value === 'text'
      ? { type: 'text', content: textContent.value }
      : { type: 'file', file: fileList.value[0]?.raw }

    const response = await apiSubmitGrade(data)
    
    const levelTagType = response.score >= 90 ? 'success' : 
                        response.score >= 75 ? 'warning' : 
                        response.score >= 60 ? 'info' : 'danger'
    
    result.value = {
      score: response.score,
      level: response.level,
      comments: response.comments,
      levelClass: response.level === '优秀' ? 'excellent' : 
                  response.level === '良好' ? 'good' : 
                  response.level === '及格' ? 'pass' : 'fail',
      levelTagType
    }
  } catch (error: any) {
    ElMessage.error(error.message || '批改失败，请重试')
  } finally {
    loading.value = false
  }
}

function clearContent() {
  textContent.value = ''
  fileList.value = []
  result.value = null
}

onMounted(() => {
  loadConfig()
})
</script>

<style scoped>
/* 全局容器 */
.app-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
  background-size: 200% 200%;
  animation: gradientShift 15s ease infinite;
  display: flex;
  flex-direction: column;
}

@keyframes gradientShift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

/* 顶部导航栏 */
.top-header {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  box-shadow: 0 2px 20px rgba(0, 0, 0, 0.08);
  padding: 0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-wrapper {
  max-width: 1600px;
  margin: 0 auto;
  padding: 20px 40px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 16px;
}

.logo-icon {
  font-size: 2.5rem;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 16px;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.logo-text h1 {
  margin: 0;
  font-size: 1.8rem;
  font-weight: 700;
  color: #2c3e50;
  line-height: 1.2;
}

.logo-text p {
  margin: 4px 0 0;
  color: #7f8c8d;
  font-size: 0.9rem;
  font-weight: 500;
}

.config-btn {
  padding: 12px 24px;
  border-radius: 12px;
  font-weight: 600;
}

.btn-icon {
  margin-right: 6px;
}

/* 主内容区 */
.main-wrapper {
  flex: 1;
  padding: 40px 20px;
  max-width: 1600px;
  margin: 0 auto;
  width: 100%;
}

.content-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
  height: 100%;
}

/* 输入区域 */
.input-section,
.result-section {
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 32px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.5);
  display: flex;
  flex-direction: column;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.input-section:hover,
.result-section:hover {
  transform: translateY(-4px);
  box-shadow: 0 15px 50px rgba(0, 0, 0, 0.15);
}

.section-header {
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid #f0f0f0;
}

.section-header h2 {
  margin: 0 0 8px 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: #2c3e50;
}

.section-desc {
  margin: 0;
  color: #7f8c8d;
  font-size: 0.9rem;
}

.input-container {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.textarea-wrapper {
  flex: 1;
  margin-bottom: 20px;
}

:deep(.el-textarea__inner) {
  border-radius: 16px;
  border: 2px solid #e4e7ed;
  padding: 16px;
  font-size: 15px;
  line-height: 1.8;
  transition: all 0.3s ease;
  resize: none;
  height: 100%;
  min-height: 400px;
}

:deep(.el-textarea__inner:focus) {
  border-color: #667eea;
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
}

.upload-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}

.upload-content {
  text-align: center;
  padding: 40px;
}

.upload-icon {
  font-size: 4rem;
  color: #667eea;
  margin-bottom: 16px;
}

.upload-text {
  font-size: 1.1rem;
  color: #2c3e50;
  margin: 12px 0;
}

.upload-text em {
  color: #667eea;
  font-style: normal;
  font-weight: 600;
}

.upload-hint {
  font-size: 0.85rem;
  color: #7f8c8d;
  margin-top: 8px;
}

:deep(.el-upload-dragger) {
  border-radius: 16px;
  border: 2px dashed #d3d4d6;
  background: #fafbfc;
  transition: all 0.3s ease;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

:deep(.el-upload-dragger:hover) {
  border-color: #667eea;
  background: #f0f4ff;
}

.action-bar {
  display: flex;
  gap: 12px;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 2px solid #f0f0f0;
}

.submit-btn {
  flex: 1;
  padding: 16px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 12px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border: none;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
  transition: all 0.3s ease;
}

.submit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
}

.clear-btn {
  padding: 16px 32px;
  border-radius: 12px;
  font-weight: 600;
}

/* 结果区域 */
.result-container {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.empty-icon {
  font-size: 5rem;
  margin-bottom: 20px;
  opacity: 0.6;
}

.empty-text {
  font-size: 1.2rem;
  color: #2c3e50;
  font-weight: 600;
  margin-bottom: 8px;
}

.empty-hint {
  font-size: 0.9rem;
  color: #7f8c8d;
}

.result-display {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.score-card {
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
  border-radius: 20px;
  padding: 40px;
  text-align: center;
  border: 2px solid #f0f0f0;
}

.score-circle {
  width: 200px;
  height: 200px;
  border-radius: 50%;
  margin: 0 auto 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  animation: scoreAppear 0.8s ease-out;
}

@keyframes scoreAppear {
  0% {
    transform: scale(0) rotate(-180deg);
    opacity: 0;
  }
  60% {
    transform: scale(1.1) rotate(10deg);
  }
  100% {
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
}

.score-inner {
  text-align: center;
  z-index: 1;
}

.score-number {
  font-size: 4rem;
  font-weight: 700;
  line-height: 1;
  color: white;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
}

.score-unit {
  font-size: 1.2rem;
  margin-top: 8px;
  opacity: 0.95;
  color: white;
}

.score-circle.excellent {
  background: linear-gradient(135deg, #67c23a, #85ce61, #95d475);
}

.score-circle.good {
  background: linear-gradient(135deg, #e6a23c, #f0a020, #f5b041);
}

.score-circle.pass {
  background: linear-gradient(135deg, #409eff, #66b1ff, #79bbff);
}

.score-circle.fail {
  background: linear-gradient(135deg, #f56c6c, #f78989, #fa9a9a);
}

.score-info {
  margin-top: 20px;
}

.level-tag {
  padding: 10px 24px;
  font-size: 18px;
  font-weight: 700;
  border-radius: 24px;
  border: none;
}

.score-desc {
  margin-top: 12px;
  color: #7f8c8d;
  font-size: 0.9rem;
}

.comments-card {
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
  border-radius: 20px;
  padding: 32px;
  border: 2px solid #f0f0f0;
  flex: 1;
}

.comments-header {
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 2px solid #f0f0f0;
}

.comments-header h3 {
  margin: 0;
  font-size: 1.3rem;
  font-weight: 700;
  color: #2c3e50;
}

.comments-body {
  padding: 20px;
  background: white;
  border-radius: 12px;
  min-height: 200px;
}

.comments-text {
  margin: 0;
  font-size: 15px;
  line-height: 1.8;
  color: #495057;
  white-space: pre-wrap;
}

/* 标签页样式 */
:deep(.custom-tabs .el-tabs__header) {
  margin-bottom: 24px;
}

:deep(.custom-tabs .el-tabs__item) {
  font-weight: 600;
  font-size: 15px;
  padding: 0 24px;
}

:deep(.custom-tabs .el-tabs__active-bar) {
  background: linear-gradient(135deg, #667eea, #764ba2);
  height: 3px;
  border-radius: 2px;
}

:deep(.custom-tabs .el-tabs__item.is-active) {
  color: #667eea;
}

/* 底部 */
.app-footer {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  text-align: center;
  padding: 24px 0;
  color: #7f8c8d;
  font-size: 0.9rem;
  font-weight: 500;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .content-grid {
    grid-template-columns: 1fr;
    gap: 24px;
  }
  
  .input-section,
  .result-section {
    min-height: auto;
  }
}

@media (max-width: 768px) {
  .header-wrapper {
    flex-direction: column;
    gap: 16px;
    padding: 16px 20px;
  }
  
  .logo-section {
    flex-direction: column;
    text-align: center;
  }
  
  .main-wrapper {
    padding: 20px 10px;
  }
  
  .input-section,
  .result-section {
    padding: 24px;
  }
  
  .score-circle {
    width: 160px;
    height: 160px;
  }
  
  .score-number {
    font-size: 3rem;
  }
  
  .action-bar {
    flex-direction: column;
  }
  
  .submit-btn,
  .clear-btn {
    width: 100%;
  }
}
</style>
