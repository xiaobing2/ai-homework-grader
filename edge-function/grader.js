/**
 * ESA 边缘函数：作业批改代理
 * 调用阿里云 AI 模型进行作业批改
 */

export default async function handler(request) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  try {
    const formData = await request.formData()
    
    // 优先使用请求中的 AccessKey，如果没有则使用环境变量
    let accessKeyId = formData.get('accessKeyId') || process.env.ALIYUN_ACCESS_KEY_ID
    let accessKeySecret = formData.get('accessKeySecret') || process.env.ALIYUN_ACCESS_KEY_SECRET

    if (!accessKeyId || !accessKeySecret) {
      throw new Error('阿里云 AccessKey 未配置')
    }

    const type = formData.get('type')
    const content = formData.get('content')
    const file = formData.get('file')

    let result

    if (type === 'text') {
      result = await gradeText(content, accessKeyId, accessKeySecret)
    } else if (type === 'file') {
      const fileBuffer = await file.arrayBuffer()
      result = await gradeFile(fileBuffer, accessKeyId, accessKeySecret)
    } else {
      throw new Error('不支持的批改类型')
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('批改失败:', error)
    return new Response(JSON.stringify({
      score: 0,
      level: '不及格',
      comments: `批改失败: ${error.message}`
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

async function gradeText(text, accessKeyId, accessKeySecret) {
  // 调用阿里云通义千问模型进行批改
  // 实际实现需要根据阿里云 API 文档进行调用
  
  // 模拟批改逻辑
  const length = text.length
  let score = 60 + Math.floor(Math.random() * 40)
  if (length < 50) score = 50 + Math.floor(Math.random() * 30)
  
  let level = '及格'
  if (score >= 90) level = '优秀'
  else if (score >= 75) level = '良好'
  else if (score < 60) level = '不及格'

  return {
    score,
    level,
    comments: `AI 评语：总体${level}，内容长度${length}字。建议加强细节描述和逻辑结构。`
  }
}

async function gradeFile(fileBuffer, accessKeyId, accessKeySecret) {
  // 调用阿里云 OCR + AI 模型进行批改
  // 实际实现需要先 OCR 识别，再调用 AI 模型批改
  
  return {
    score: 75 + Math.floor(Math.random() * 20),
    level: '良好',
    comments: 'AI 评语：作业完成度良好，字迹清晰。建议注意格式规范和细节完善。'
  }
}
