import axios from "axios"

axios.interceptors.request.use((config) => {
  const token = localStorage.getItem("token")

  if (token) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.clear()

      if (window.location.pathname !== "/") {
        window.location.replace("/")
      }
    }

    return Promise.reject(error)
  }
)
