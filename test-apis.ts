import axios from 'axios'

const APIs = {
  netease: {
    name: '网易云音乐',
    baseUrl: 'https://api-enhanced-kappa-vert.vercel.app',
    testPlaylistId: '8715089246'
  },
  qq: {
    name: 'QQ音乐',
    baseUrl: 'https://c.y.qq.com',
    testPlaylistId: ''
  },
  kugou: {
    name: '酷狗音乐',
    baseUrl: 'https://www.kugou.com',
    testPlaylistId: ''
  },
  kuwo: {
    name: '酷我音乐',
    baseUrl: 'https://www.kuwo.cn',
    testPlaylistId: ''
  },
  migu: {
    name: '咪咕音乐',
    baseUrl: 'https://music.migu.cn',
    testPlaylistId: ''
  }
}

async function testNeteaseAPI() {
  console.log('\n=== 测试网易云音乐 API ===')
  const api = APIs.netease
  
  try {
    console.log(`API 地址: ${api.baseUrl}`)
    
    const response = await axios.get(`${api.baseUrl}/playlist/detail`, {
      params: { id: api.testPlaylistId },
      timeout: 10000
    })
    
    if (response.data.code === 200) {
      console.log('✅ 网易云音乐 API 正常')
      console.log(`歌单名称: ${response.data.playlist?.name}`)
      console.log(`歌曲数量: ${response.data.playlist?.trackCount}`)
      return true
    } else {
      console.log('❌ 网易云音乐 API 返回错误')
      console.log('响应:', response.data)
      return false
    }
  } catch (error: any) {
    console.log('❌ 网易云音乐 API 连接失败')
    console.log('错误:', error.message)
    return false
  }
}

async function testNeteaseViaProxy() {
  console.log('\n=== 测试网易云音乐 API (通过前端代理) ===')
  
  try {
    const response = await axios.get('/netease-api/playlist/detail', {
      params: { id: '8715089246' },
      timeout: 10000
    })
    
    if (response.data.code === 200) {
      console.log('✅ 前端代理正常')
      console.log(`歌单名称: ${response.data.playlist?.name}`)
      console.log(`歌曲数量: ${response.data.playlist?.trackCount}`)
      return true
    } else {
      console.log('❌ 前端代理返回错误')
      return false
    }
  } catch (error: any) {
    console.log('❌ 前端代理连接失败')
    console.log('错误:', error.message)
    return false
  }
}

async function main() {
  console.log('开始测试各平台 API...\n')
  
  // 测试网易云音乐（直接连接）
  await testNeteaseAPI()
  
  // 测试网易云音乐（通过前端代理）
  await testNeteaseViaProxy()
  
  console.log('\n=== 测试完成 ===')
}

main().catch(console.error)
