import type { ApiResponse } from '@repo/types'

export const API_URL = process.env.NEXT_PUBLIC_API_URL!

interface TokenManager {
  getAccessToken: () => string | null
  getRefreshToken: () => string | null
  refreshTokens: () => Promise<void>
  logout: () => Promise<void>
}

class ApiClient {
  private tokenManager: TokenManager | null = null

  setTokenManager(tokenManager: TokenManager) {
    this.tokenManager = tokenManager
  }

  private async makeRequest<T>(url: string, options: RequestInit = {}, retryCount = 0): Promise<T> {
    const maxRetries = 1 // Only retry once after token refresh

    try {
      const accessToken = this.tokenManager?.getAccessToken()
      const headers = {
        'Content-Type': 'application/json',
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        ...options.headers
      }

      const response = await fetch(url, {
        ...options,
        headers
      })

      const json: ApiResponse<T> = await response.json()

      if (!json.success) {
        // Check if it's a token expiration error
        if (json.error?.includes('expired') || response.status === 401) {
          if (retryCount < maxRetries && this.tokenManager) {
            try {
              // Try to refresh the token
              await this.tokenManager.refreshTokens()
              // Retry the request with the new token
              return this.makeRequest<T>(url, options, retryCount + 1)
            } catch (refreshError) {
              // If refresh fails, logout the user
              await this.tokenManager.logout()
              throw new Error('Session expired. Please log in again.')
            }
          } else {
            // Max retries reached or no token manager, logout
            if (this.tokenManager) {
              await this.tokenManager.logout()
            }
            throw new Error('Session expired. Please log in again.')
          }
        }
        throw new Error(json.error || 'Request failed')
      }

      return json.data
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Network error')
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.makeRequest<T>(`${API_URL}${endpoint}`)
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.makeRequest<T>(`${API_URL}${endpoint}`, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined
    })
  }

  async postForm<T>(endpoint: string, formData: URLSearchParams): Promise<T> {
    return this.makeRequest<T>(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData.toString()
    })
  }

  async patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.makeRequest<T>(`${API_URL}${endpoint}`, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined
    })
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.makeRequest<T>(`${API_URL}${endpoint}`, {
      method: 'DELETE'
    })
  }

  async upload<T>(endpoint: string, formData: FormData): Promise<T> {
    const accessToken = this.tokenManager?.getAccessToken()
    const headers: Record<string, string> = {}

    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData
    })

    const json: ApiResponse<T> = await response.json()

    if (!json.success) {
      if (json.error?.includes('expired') || response.status === 401) {
        if (this.tokenManager) {
          try {
            await this.tokenManager.refreshTokens()
            // Retry the upload with new token
            const newAccessToken = this.tokenManager.getAccessToken()
            const newHeaders: Record<string, string> = {}

            if (newAccessToken) {
              newHeaders.Authorization = `Bearer ${newAccessToken}`
            }

            const retryResponse = await fetch(`${API_URL}${endpoint}`, {
              method: 'POST',
              headers: newHeaders,
              body: formData
            })

            const retryJson: ApiResponse<T> = await retryResponse.json()
            if (!retryJson.success) {
              throw new Error(retryJson.error || 'Upload failed')
            }
            return retryJson.data
          } catch (refreshError) {
            await this.tokenManager.logout()
            throw new Error('Session expired. Please log in again.')
          }
        }
      }
      throw new Error(json.error || 'Upload failed')
    }

    return json.data
  }
}

export const apiClient = new ApiClient()
