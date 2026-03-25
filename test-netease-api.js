#!/usr/bin/env node

/**
 * 网易云音乐 API 测试脚本
 * 测试各种接口是否可用
 */

const API_BASE = 'https://api-enhanced-kappa-vert.vercel.app'
const TEST_PLAYLIST_ID = '8715089246'

async function testAPI(endpoint, params, description) {
  console.log(`\n📡 测试: ${description}`)
  console.log(`   URL: ${endpoint}`)
  
  try {
    const url = new URL(endpoint, API_BASE)
    if (params) {
      Object.keys(params).forEach(key => url.searchParams.append(key, params[key]))
    }
    
    console.log(`   完整URL: ${url.toString()}`)
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })
    
    const data = await response.json()
    
    if (response.ok) {
      console.log(`   ✅ 状态: ${response.status}`)
      
      if (endpoint.includes('/inner/version')) {
        console.log(`   📦 响应:`, JSON.stringify(data).substring(0, 200))
      } else if (endpoint.includes('/search')) {
        console.log(`   📦 搜索结果数: ${data.result?.songs?.length || 0}`)
      } else if (endpoint.includes('/playlist/detail')) {
        console.log(`   📦 歌单名称: ${data.playlist?.name}`)
        console.log(`   📦 歌曲数量: ${data.playlist?.trackCount}`)
        console.log(`   📦 TrackIds数量: ${data.playlist?.trackIds?.length || 0}`)
      } else if (endpoint.includes('/song/detail')) {
        console.log(`   📦 歌曲数量: ${data.songs?.length || 0}`)
        if (data.songs?.[0]) {
          console.log(`   📦 第一首: ${data.songs[0].name} - ${data.songs[0].ar?.[0]?.name || '未知'}`)
        }
      }
      return true
    } else {
      console.log(`   ❌ 状态: ${response.status}`)
      console.log(`   📦 响应:`, JSON.stringify(data).substring(0, 200))
      return false
    }
  } catch (error) {
    console.log(`   ❌ 错误: ${error.message}`)
    return false
  }
}

async function main() {
  console.log('=== 网易云音乐 API 完整性测试 ===')
  console.log(`API 地址: ${API_BASE}`)
  
  const results = []
  
  // 1. 测试版本接口
  results.push(await testAPI('/inner/version', null, '版本信息'))
  
  // 2. 测试歌单详情
  results.push(await testAPI('/playlist/detail', { id: TEST_PLAYLIST_ID }, '获取歌单详情'))
  
  // 3. 测试搜索
  results.push(await testAPI('/search', { keywords: '周杰伦' }, '搜索歌曲'))
  
  // 4. 测试歌曲详情
  results.push(await testAPI('/song/detail', { ids: '1307591526' }, '获取歌曲详情'))
  
  console.log('\n=== 测试结果汇总 ===')
  console.log(`通过: ${results.filter(r => r).length}/${results.length}`)
  
  if (results.every(r => r)) {
    console.log('🎉 所有接口都可用！')
  } else {
    console.log('⚠️ 部分接口不可用，需要检查')
  }
}

main().catch(console.error)
