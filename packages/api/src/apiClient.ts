import type { ApiResponse } from '@repo/types'

export const API_URL = process.env.NEXT_PUBLIC_API_URL!

class ApiClient {
  private async makeRequest<T>(
    url: string,
    options: RequestInit = {},
    accessToken?: string
  ): Promise<T> {
    try {
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

  async get<T>(endpoint: string, accessToken?: string): Promise<T> {
    return this.makeRequest<T>(`${API_URL}${endpoint}`, {}, accessToken)
  }

  async post<T>(endpoint: string, data?: any, accessToken?: string): Promise<T> {
    return this.makeRequest<T>(
      `${API_URL}${endpoint}`,
      {
        method: 'POST',
        body: data ? JSON.stringify(data) : undefined
      },
      accessToken
    )
  }

  async postForm<T>(endpoint: string, formData: URLSearchParams, accessToken?: string): Promise<T> {
    return this.makeRequest<T>(
      `${API_URL}${endpoint}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData.toString()
      },
      accessToken
    )
  }

  async patch<T>(endpoint: string, data?: any, accessToken?: string): Promise<T> {
    return this.makeRequest<T>(
      `${API_URL}${endpoint}`,
      {
        method: 'PATCH',
        body: data ? JSON.stringify(data) : undefined
      },
      accessToken
    )
  }

  async put<T>(endpoint: string, data?: any, accessToken?: string): Promise<T> {
    return this.makeRequest<T>(
      `${API_URL}${endpoint}`,
      {
        method: 'PUT',
        body: data ? JSON.stringify(data) : undefined
      },
      accessToken
    )
  }

  async delete<T>(endpoint: string, accessToken?: string): Promise<T> {
    return this.makeRequest<T>(
      `${API_URL}${endpoint}`,
      {
        method: 'DELETE'
      },
      accessToken
    )
  }

  async upload<T>(endpoint: string, formData: FormData, accessToken?: string): Promise<T> {
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
      throw new Error(json.error || 'Upload failed')
    }

    return json.data
  }
}

export const apiClient = new ApiClient()
