/**
 * 作业批改服务
 * 支持文本或文件上传。默认使用模拟数据，若配置了 EDGE_FUNCTION_URL 则调用边缘函数。
 */

export interface GradeRequest {
  type: 'text' | 'file'
  content?: string
  file?: File
}

export interface GradeResponse {
  score: number // 0-100
  level: '优秀' | '良好' | '及格' | '不及格'
  comments: string
}

const EDGE_FUNCTION_URL = import.meta.env.VITE_EDGE_FUNCTION_URL || ''
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true' || !EDGE_FUNCTION_URL

function mockGrade(data: GradeRequest): Promise<GradeResponse> {
  return new Promise((resolve) => {
    setTimeout(() => {
      // 简单根据内容长度打分
      let score = 60 + Math.floor(Math.random() * 40)
      if (data.type === 'text' && data.content) {
        if (data.content.length < 30) score = 50 + Math.floor(Math.random() * 30)
      }
      let level: GradeResponse['level'] = '及格'
      if (score >= 90) level = '优秀'
      else if (score >= 75) level = '良好'
      else if (score < 60) level = '不及格'

      resolve({
        score,
        level,
        comments: `AI 评语：总体${level}，请注意提升写作结构和细节描述。`
      })
    }, 1200)
  })
}

export async function submitGrade(data: GradeRequest): Promise<GradeResponse> {
  // 获取用户配置的 AccessKey
  const saved = localStorage.getItem('aliyun_accesskey')
  let accessKeyId = ''
  let accessKeySecret = ''
  
  if (saved) {
    try {
      const config = JSON.parse(saved)
      accessKeyId = config.accessKeyId || ''
      accessKeySecret = config.accessKeySecret || ''
    } catch (e) {
      console.error('读取 AccessKey 配置失败:', e)
    }
  }

  // 如果使用模拟模式或边缘函数未配置，使用模拟数据
  if (USE_MOCK || !accessKeyId || !accessKeySecret) {
    if (!accessKeyId || !accessKeySecret) {
      console.log('AccessKey 未配置，使用模拟批改结果')
    } else {
      console.log('使用模拟批改结果（开发环境）')
    }
    return await mockGrade(data)
  }

  const form = new FormData()
  form.append('type', data.type)
  form.append('accessKeyId', accessKeyId)
  form.append('accessKeySecret', accessKeySecret)
  if (data.type === 'text' && data.content) form.append('content', data.content)
  if (data.type === 'file' && data.file) form.append('file', data.file)

  try {
    const res = await fetch(EDGE_FUNCTION_URL, { method: 'POST', body: form })
    
    if (!res.ok) {
      // 如果边缘函数返回 404，自动降级到模拟模式
      if (res.status === 404) {
        console.warn('边缘函数未找到，切换到模拟模式')
        return await mockGrade(data)
      }
      throw new Error(`批改失败: ${res.status}`)
    }
    
    return await res.json()
  } catch (error: any) {
    // 网络错误或其他错误，降级到模拟模式
    if (error.message?.includes('404') || error.message?.includes('Failed to fetch')) {
      console.warn('边缘函数调用失败，切换到模拟模式:', error.message)
      return await mockGrade(data)
    }
    throw error
  }
}
