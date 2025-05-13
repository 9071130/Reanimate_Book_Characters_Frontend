import axios from 'axios'
import { BASE_URL } from '@/api/config'

// axios实例
const service = axios.create({
  baseURL: BASE_URL,
  timeout: 1000000, 
})

// 请求拦截器
service.interceptors.request.use(
  config => {
    // 加通用请求头
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 响应拦截器
// 跨域问题后端处理
service.interceptors.response.use(
  response => {
    console.log("✅ 接收到的完整响应：", response)
    return response
  },
  error => {
    console.error('请求错误：', error)
    return Promise.reject(error)
  }
)

export const get = (url, params, dataType=undefined) => {
  return service({
    url,
    method: 'get',
    params,
    responseType: dataType
  })
}

export const post = (url, data) => {
  return service({
    url,
    method: 'post',
    data
  })
} 